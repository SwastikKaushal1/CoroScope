"""Run from apps/api:  python -m pytest -q"""
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from ml.preprocess import LEAKAGE_COLS, apply_schema, assert_no_leakage, build_targets, fit_schema


def toy():
    return pd.DataFrame({
        "Age": [50, 60, 70, 45], "Sex": ["Male", "Fmale", "Male", "Fmale"], "DM": ["Y", "N", "N", "Y"],
        "VHD": ["N", "mild", "Moderate", "N"], "FBS": [90, np.nan, 120, 100],
        "LAD": [1, 0, 1, 0], "LCX": [0, 0, 1, 0], "RCA": [1, 0, 0, 0], "Cath": ["Cad", "Normal", "Cad", "Normal"]})


def test_targets_never_in_features():
    X = apply_schema(toy(), fit_schema(toy()))
    assert not {c.lower() for c in X.columns} & {c.lower() for c in LEAKAGE_COLS}


def test_guard_fires_on_leakage():
    with pytest.raises(AssertionError):
        assert_no_leakage(toy())


def test_targets_are_binary():
    y = build_targets(toy())
    assert set(y.columns) == {"CAD", "LAD", "LCX", "RCA"} and set(np.unique(y.values)) <= {0, 1}


def test_single_row_encoding_matches_training():
    schema = fit_schema(toy())
    row = apply_schema(pd.DataFrame([{"age": 55, "sex": "Male", "dm": "N", "vhd": "N"}]), schema)
    assert row["VHD"].iloc[0] == "N"                      # category, NOT coerced to 0 as a Y/N flag
    assert row["Sex"].iloc[0] == 1 and row["DM"].iloc[0] == 0
    assert row["FBS"].isna().iloc[0]                      # missing -> NaN -> imputed in pipeline


def test_saved_bundles_exclude_targets():
    models = Path(__file__).resolve().parents[1] / "models"
    if not (models / "CAD.joblib").exists():
        pytest.skip("train first")
    import joblib
    for t in ["CAD", "LAD", "LCX", "RCA"]:
        cols = {c.lower() for c in joblib.load(models / f"{t}.joblib")["feature_columns"]}
        assert not cols & {c.lower() for c in LEAKAGE_COLS}
