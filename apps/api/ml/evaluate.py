"""Metrics, bootstrap CI, threshold selection, calibration."""
import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

SEED = 42


def bootstrap_auc_ci(y, p, n_boot=1000):
    rng, aucs = np.random.default_rng(SEED), []
    y, p = np.asarray(y), np.asarray(p)
    for _ in range(n_boot):
        i = rng.integers(0, len(y), len(y))
        if len(set(y[i])) == 2:
            aucs.append(roc_auc_score(y[i], p[i]))
    return [float(np.percentile(aucs, 2.5)), float(np.percentile(aucs, 97.5))]


def pick_threshold(y, proba):
    """Youden's J (sensitivity + specificity - 1) on out-of-fold probabilities.
    Prevalence-independent, so it behaves for both CAD (71% pos) and LCX/RCA (~38% pos)."""
    fpr, tpr, thr = roc_curve(y, proba)
    j = tpr - fpr
    t = float(thr[int(np.argmax(j))])
    return float(np.clip(t, 0.05, 0.95))


def evaluate(y, proba, thr=0.5, curves=True, n_boot=1000):
    y, proba = np.asarray(y), np.asarray(proba)
    pred = (proba >= thr).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    res = {
        "threshold": float(thr),
        "accuracy": accuracy_score(y, pred),
        "precision": precision_score(y, pred, zero_division=0),
        "recall": recall_score(y, pred, zero_division=0),          # = sensitivity
        "specificity": float(tn / (tn + fp)) if (tn + fp) else 0.0,
        "f1": f1_score(y, pred, zero_division=0),
        "roc_auc": roc_auc_score(y, proba),
        "pr_auc": average_precision_score(y, proba),
        "brier": brier_score_loss(y, proba),
        "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
    }
    if curves:
        fpr, tpr, _ = roc_curve(y, proba)
        k = max(len(fpr) // 100, 1)
        res["roc_auc_ci95"] = bootstrap_auc_ci(y, proba, n_boot)
        res["roc_curve"] = {"fpr": fpr[::k].tolist(), "tpr": tpr[::k].tolist()}
    return res


def calibration_points(y, proba, n_bins=5):
    """Reliability-curve points (quantile bins; test sets are tiny)."""
    true_f, pred_m = calibration_curve(y, proba, n_bins=n_bins, strategy="quantile")
    return {"prob_pred": pred_m.tolist(), "prob_true": true_f.tolist()}
