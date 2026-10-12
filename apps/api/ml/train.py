"""CardioMap ML: predict CAD + LAD / LCX / RCA stenosis (Z-Alizadeh Sani).

Run from apps/api (or `docker compose run --rm api python -m ml.train`):
    python -m ml.train                         # full run on data/z_alizadeh_sani.csv
    python -m ml.train --tune                  # + hyper-parameter search
    python -m ml.train --quick                 # fast smoke run

Outputs (models/):  <TARGET>.joblib, metrics.json, meta.json, feature_schema.json, presets.json

Validation design
  1. 80/20 stratified split (test set touched ONCE, for the final report).
  2. On the 80%: repeated stratified CV compares models (all preprocessing inside folds).
  3. Best model per target -> sigmoid calibration (so probabilities are meaningful for artery colours).
  4. Decision threshold chosen on out-of-fold calibrated probabilities (Youden's J), never on the test set.
  5. Honest test metrics from a model fitted on the 80% only.
  6. Deployed model is refit on all 303 rows.
"""
import argparse
import json
import os
import platform
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import VarianceThreshold
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import (
    RandomizedSearchCV,
    RepeatedStratifiedKFold,
    StratifiedKFold,
    cross_val_predict,
    cross_validate,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.explain import global_importance
from ml.evaluate import calibration_points, evaluate, pick_threshold
from ml.preprocess import TARGETS, apply_schema, assert_no_leakage, build_targets, fit_schema, load

os.environ.setdefault("PYTHONWARNINGS", "ignore")  # inherited by the CV worker processes started later
warnings.filterwarnings("ignore")

try:
    from xgboost import XGBClassifier
except ImportError:
    XGBClassifier = None

SEED, TEST_SIZE = 42, 0.20
SCORING = ["roc_auc", "f1", "accuracy", "precision", "recall"]
API_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = Path(os.environ.get("MODEL_DIR", API_DIR / "models"))
DATA_DIR = Path(os.environ["DATA_DIR"]) if "DATA_DIR" in os.environ else API_DIR.parent.parent / "data"
DEFAULT_DATA = DATA_DIR / "z_alizadeh_sani.csv"
CFG = dict(cv_folds=5, cv_repeats=5, n_boot=1000, n_trees=500, xgb_trees=300, tune_iter=15)
QUICK = dict(cv_folds=3, cv_repeats=1, n_boot=200, n_trees=100, xgb_trees=100, tune_iter=4)

PARAM_DIST = {
    "logreg_l1": {"clf__C": [0.05, 0.1, 0.25, 0.5, 1.0, 2.0]},
    "random_forest": {"clf__max_depth": [None, 4, 6, 10], "clf__min_samples_leaf": [1, 3, 5, 8],
                      "clf__max_features": ["sqrt", 0.3, 0.5]},
    "xgboost": {"clf__max_depth": [2, 3, 4], "clf__learning_rate": [0.01, 0.03, 0.05, 0.1],
                "clf__n_estimators": [150, 300, 500], "clf__subsample": [0.7, 0.8, 1.0],
                "clf__colsample_bytree": [0.6, 0.8, 1.0], "clf__min_child_weight": [1, 2, 5],
                "clf__reg_lambda": [1, 5, 10]},
}


# ----------------------------- models ---------------------------------
def make_pipeline(X, model, scale):
    """Everything fitted lives in the pipeline, so CV folds never leak."""
    num = X.select_dtypes(include="number").columns.tolist()
    cat = X.select_dtypes(exclude="number").columns.tolist()
    num_steps = [("imp", SimpleImputer(strategy="median"))]
    if scale:
        num_steps.append(("sc", StandardScaler()))
    ct = ColumnTransformer(
        [("num", Pipeline(num_steps), num),
         ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                           ("oh", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]), cat)],
        verbose_feature_names_out=False)
    ct.set_output(transform="pandas")
    return Pipeline([("ct", ct), ("var", VarianceThreshold(0.0)), ("clf", clone(model))])


def candidates(y):
    spw = float((y == 0).sum() / max((y == 1).sum(), 1))
    m = {
        "logreg_l1": (LogisticRegression(penalty="l1", solver="liblinear", C=0.5,
                                         class_weight="balanced", max_iter=2000), True),
        "random_forest": (RandomForestClassifier(n_estimators=CFG["n_trees"], min_samples_leaf=3,
                                                 class_weight="balanced_subsample",
                                                 n_jobs=1, random_state=SEED), False),
    }
    if XGBClassifier is not None:
        m["xgboost"] = (XGBClassifier(n_estimators=CFG["xgb_trees"], max_depth=3, learning_rate=0.03,
                                      subsample=0.8, colsample_bytree=0.8, reg_lambda=5.0,
                                      min_child_weight=2, scale_pos_weight=spw,
                                      eval_metric="logloss", random_state=SEED, n_jobs=1), False)
    return m


def build(name, X, y, params=None):
    model, scale = candidates(y)[name]
    pipe = make_pipeline(X, model, scale)
    if params:
        pipe.set_params(**params)
    return pipe


def calibrated(pipe):
    """Sigmoid (Platt) calibration fitted on 5-fold out-of-fold predictions. Sigmoid > isotonic
    for ~250 rows. ensemble=False keeps ONE refit model (not an average of 5), so serving is
    ~5x faster - this is what makes the live what-if simulator feel instant."""
    return CalibratedClassifierCV(clone(pipe), method="sigmoid", cv=5, ensemble=False)


def tune(name, X, y):
    grid = PARAM_DIST[name]
    size = int(np.prod([len(v) for v in grid.values()]))
    search = RandomizedSearchCV(
        build(name, X, y), grid, n_iter=min(CFG["tune_iter"], size), scoring="roc_auc",
        cv=StratifiedKFold(5, shuffle=True, random_state=SEED), random_state=SEED, n_jobs=-1)
    search.fit(X, y)
    return search.best_params_


def select_best(cv, tol=0.005):
    """Highest CV ROC-AUC; ties (within tol) broken by CV F1."""
    top = max(r["roc_auc"]["mean"] for r in cv.values())
    close = [n for n, r in cv.items() if top - r["roc_auc"]["mean"] <= tol]
    return max(close, key=lambda n: cv[n]["f1"]["mean"])


def summarize(r):
    return {m: {"mean": float(r[f"test_{m}"].mean()), "std": float(r[f"test_{m}"].std())} for m in SCORING}


def jsonable(o):
    if hasattr(o, "item"):
        return o.item()
    return str(o)


# ----------------------------- artefacts ------------------------------
def feature_schema_json(df, X, schema):
    cols = []
    for c in schema["columns"]:
        if c in schema["cat"]:
            cols.append({"name": c, "kind": "categorical", "values": schema["cat"][c]})
        else:
            kind = "sex" if c in schema["sex"] else "binary" if c in schema["yn"] else "numeric"
            col = X[c].astype(float)
            cols.append({"name": c, "kind": kind, "min": float(col.min()), "max": float(col.max()),
                         "median": float(col.median()), "n_missing": int(col.isna().sum())})
    return {"columns": cols}


def make_presets(df, X, bundle, schema):
    """One high-risk and one low-risk REAL dataset row, for the UI preset buttons."""
    p = bundle["pipeline"].predict_proba(X)[:, 1]
    y = build_targets(df)["CAD"].to_numpy()
    hi = int(np.argmax(np.where(y == 1, p, -1)))
    lo = int(np.argmin(np.where(y == 0, p, 2)))

    def row(i):
        r = df.loc[df.index[i], schema["columns"]]
        return {k: (None if pd.isna(v) else (v.item() if hasattr(v, "item") else v)) for k, v in r.items()}

    return {"high_risk": row(hi), "low_risk": row(lo)}


# ----------------------------- main -----------------------------------
def main(data_path, do_tune=False, quick=False):
    if quick:
        CFG.update(QUICK)
    df = load(data_path)
    schema = fit_schema(df)
    X, Y = apply_schema(df, schema), build_targets(df)
    assert_no_leakage(X)
    OUT_DIR.mkdir(exist_ok=True)
    cv_split = RepeatedStratifiedKFold(n_splits=CFG["cv_folds"], n_repeats=CFG["cv_repeats"], random_state=SEED)
    oof_split = StratifiedKFold(5, shuffle=True, random_state=SEED)
    report, bundles = {}, {}

    for t in TARGETS:
        y = Y[t]
        print(f"\n=== {t}: {int(y.sum())} positive / {int((y == 0).sum())} negative ===")
        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=TEST_SIZE, stratify=y, random_state=SEED)

        # 1) optional tuning (on train split only) + model comparison by repeated CV
        params, cv = {}, {}
        for name in candidates(ytr):
            params[name] = tune(name, Xtr, ytr) if do_tune else {}
            r = cross_validate(build(name, Xtr, ytr, params[name]), Xtr, ytr, cv=cv_split,
                               scoring=SCORING, n_jobs=-1)
            cv[name] = summarize(r)
            print(f"  CV {name:14s} AUC {cv[name]['roc_auc']['mean']:.3f}  F1 {cv[name]['f1']['mean']:.3f}")
        base = cross_validate(make_pipeline(Xtr, DummyClassifier(strategy="prior"), False), Xtr, ytr,
                              cv=cv_split, scoring=SCORING, n_jobs=-1)
        cv_baseline = summarize(base)
        best = select_best(cv)

        # 2) decision threshold from OUT-OF-FOLD calibrated probabilities (train split only)
        oof = cross_val_predict(calibrated(build(best, Xtr, ytr, params[best])), Xtr, ytr, cv=oof_split,
                                method="predict_proba", n_jobs=-1)[:, 1]
        thr = pick_threshold(ytr, oof)

        # 3) honest held-out evaluation: calibrated model fitted on the train split only
        held = calibrated(build(best, Xtr, ytr, params[best])).fit(Xtr, ytr)
        proba = held.predict_proba(Xte)[:, 1]
        test = evaluate(yte, proba, thr, n_boot=CFG["n_boot"])
        test["calibration"] = calibration_points(yte, proba)
        test_default = evaluate(yte, proba, 0.5, curves=False)
        print(f"  -> best {best} | thr {thr:.2f} | held-out AUC {test['roc_auc']:.3f} "
              f"(95% CI {test['roc_auc_ci95'][0]:.2f}-{test['roc_auc_ci95'][1]:.2f}) | "
              f"sens {test['recall']:.2f} spec {test['specificity']:.2f} F1 {test['f1']:.2f} "
              f"Brier {test['brier']:.3f}")

        # 4) deploy: calibrated model for probabilities + plain model for SHAP, both on all data
        explain_pipe = build(best, X, y, params[best]).fit(X, y)
        bundle = {
            "target": t, "model_name": best, "threshold": thr, "schema": schema,
            "feature_columns": list(X.columns),
            "pipeline": calibrated(build(best, X, y, params[best])).fit(X, y),
            "explain_pipeline": explain_pipe,
            "shap_background": pd.DataFrame(np.asarray(explain_pipe[:-1].transform(X), dtype=float),
                                            columns=explain_pipe[:-1].get_feature_names_out()),
            "sklearn_version": sklearn.__version__,
        }
        joblib.dump(bundle, OUT_DIR / f"{t}.joblib")
        bundles[t] = bundle
        report[t] = {"model": best, "best_params": params[best], "threshold": thr,
                     "n_pos": int(y.sum()), "n_neg": int((y == 0).sum()),
                     "cv": cv, "cv_baseline_dummy": cv_baseline,
                     "test": test, "test_at_0.5": test_default,
                     "global_importance": global_importance(bundle, X)}

    (OUT_DIR / "metrics.json").write_text(json.dumps(report, indent=2, default=jsonable))
    (OUT_DIR / "feature_schema.json").write_text(json.dumps(feature_schema_json(df, X, schema), indent=2))
    (OUT_DIR / "presets.json").write_text(json.dumps(make_presets(df, X, bundles["CAD"], schema), indent=2,
                                                     default=jsonable))
    meta = {"python": platform.python_version(), "sklearn": sklearn.__version__, "pandas": pd.__version__,
            "numpy": np.__version__, "seed": SEED,
            "n_rows": int(len(df)), "n_features": int(X.shape[1]), "tuned": do_tune, "quick": quick,
            "config": CFG, "xgboost": XGBClassifier is not None}
    (OUT_DIR / "meta.json").write_text(json.dumps(meta, indent=2))
    print(f"\nSaved models + metrics.json + feature_schema.json + presets.json to {OUT_DIR}/")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(DEFAULT_DATA), help="path to Z-Alizadeh Sani csv/xlsx")
    ap.add_argument("--tune", action="store_true", help="randomized hyper-parameter search per model")
    ap.add_argument("--quick", action="store_true", help="small/fast settings for smoke tests")
    a = ap.parse_args()
    main(a.data, a.tune, a.quick)
