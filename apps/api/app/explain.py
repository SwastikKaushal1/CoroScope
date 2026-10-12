"""Per-patient and global SHAP explanations.

- Probabilities come from the CALIBRATED model; SHAP explains the matching plain pipeline
  (same model type + hyper-parameters, fitted on the same data).
- SHAP units differ by model (log-odds for logreg/XGBoost, probability for random forest),
  so we also return `share`: signed fraction of total |SHAP|, comparable across models.
- One-hot columns (e.g. VHD_Moderate) are summed back to their raw feature (VHD).
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

try:
    import shap
except ImportError:  # API still serves probabilities without SHAP
    shap = None


class TargetExplainer:
    def __init__(self, bundle):
        self.base = bundle["explain_pipeline"]
        self.clf = self.base.named_steps["clf"]
        bg = bundle["shap_background"]
        self.names = list(bg.columns)
        self.raw_cols = list(bundle["schema"]["columns"])
        self.cat_cols = sorted(bundle["schema"]["cat"], key=len, reverse=True)
        self.explainer = None
        if shap is not None:
            if isinstance(self.clf, LogisticRegression):
                self.explainer = shap.LinearExplainer(self.clf, bg)
            else:
                self.explainer = shap.TreeExplainer(self.clf)

    def _raw_name(self, enc):
        if enc in self.raw_cols:
            return enc
        for c in self.cat_cols:
            if enc.startswith(c + "_"):
                return c
        return enc

    def shap_matrix(self, X):
        """X: frame from apply_schema -> (DataFrame n x raw_features) of SHAP values, one-hots summed."""
        Xt = pd.DataFrame(np.asarray(self.base[:-1].transform(X), dtype=float), columns=self.names)
        sv = self.explainer.shap_values(Xt)
        if isinstance(sv, list):          # older shap: [class0, class1]
            sv = sv[1]
        sv = np.asarray(sv)
        if sv.ndim == 3:                  # newer shap: (n, features, classes)
            sv = sv[:, :, 1]
        enc = pd.DataFrame(sv, columns=self.names, index=X.index)
        return enc.T.groupby([self._raw_name(n) for n in self.names], sort=False).sum().T

    def explain(self, row):
        """row: 1-row frame from apply_schema. Returns [{feature, input, shap, share}] sorted by |shap|."""
        if self.explainer is None:
            return []
        grouped = self.shap_matrix(row).iloc[0]
        total = float(grouped.abs().sum()) + 1e-12
        out = []
        for g, v in grouped.items():
            val = row[g].iloc[0] if g in row.columns else None
            val = None if (val is None or pd.isna(val)) else (val.item() if hasattr(val, "item") else val)
            out.append({"feature": g, "input": val, "shap": float(v), "share": float(v) / total})
        return sorted(out, key=lambda d: abs(d["shap"]), reverse=True)


def global_importance(bundle, X, top_k=15):
    """Mean |SHAP| over the dataset, as a share of the total. Used by the model-performance page."""
    exp = TargetExplainer(bundle)
    if exp.explainer is None:
        return []
    m = exp.shap_matrix(X).abs().mean()
    m = m / (m.sum() + 1e-12)
    return [{"feature": f, "importance": float(v)} for f, v in m.sort_values(ascending=False)[:top_k].items()]
