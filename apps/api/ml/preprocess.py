"""Shared cleaning for TRAINING and SERVING (single source of truth).

The encoding schema is *learned once* at training time (fit_schema) and saved inside
every model bundle, then re-applied at inference (apply_schema). This guarantees a
single-row request is encoded exactly like the training data (e.g. VHD='N' stays a
category and is not mistaken for a Y/N flag).
"""
import re
from pathlib import Path

import numpy as np
import pandas as pd

VESSELS = ["LAD", "LCX", "RCA"]
TARGETS = ["CAD"] + VESSELS
LEAKAGE_COLS = ["LAD", "LCX", "RCA", "Cath", "CAD"]   # never used as inputs
CAD_SOURCE_COLS = ["Cath", "CAD"]                     # overall label; name differs by file version
NEGATIVE = {"normal", "n", "no", "0", "false", "neg", "negative"}

YN_MAP = {"y": 1, "n": 0, "yes": 1, "no": 0, "true": 1, "false": 0, "1": 1, "0": 0, "1.0": 1, "0.0": 0}
SEX_MAP = {"male": 1, "m": 1, "female": 0, "fmale": 0, "f": 0, "1": 1, "0": 0, "1.0": 1, "0.0": 0}


def _key(name):
    """'Typical Chest Pain' / 'typical_chest_pain' / 'TypicalChestPain' -> 'typicalchestpain'."""
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


# ----------------------------- loading / targets ----------------------
def load(path):
    path = Path(path)
    df = pd.read_csv(path) if path.suffix.lower() == ".csv" else pd.read_excel(path)
    df.columns = [str(c).strip() for c in df.columns]
    return df


def find_col(df, name):
    for c in df.columns:
        if c.lower() == name.lower():
            return c
    raise KeyError(f"'{name}' not found. Columns: {list(df.columns)}")


def to_binary(s):
    """1 = present, 0 = absent. Handles 0/1, Y/N, Cad/Normal, Stenotic/Normal..."""
    if pd.api.types.is_numeric_dtype(s):
        return (s > 0).astype(int)
    return (~s.astype(str).str.strip().str.lower().isin(NEGATIVE)).astype(int)


def build_targets(df):
    src = next((c for n in CAD_SOURCE_COLS for c in df.columns if c.lower() == n.lower()), None)
    if src is None:
        raise KeyError(f"No overall CAD column ({CAD_SOURCE_COLS}). Columns: {list(df.columns)}")
    y = pd.DataFrame({"CAD": to_binary(df[src])})
    for v in VESSELS:
        y[v] = to_binary(df[find_col(df, v)])
    return y


def assert_no_leakage(X):
    banned = {c.lower() for c in LEAKAGE_COLS}
    bad = [c for c in X.columns if c.lower() in banned]
    assert not bad, f"Target leakage: {bad} in feature matrix"


# ----------------------------- schema ---------------------------------
def feature_frame(df):
    """Drop leakage columns (LAD, LCX, RCA, Cath, CAD)."""
    banned = {c.lower() for c in LEAKAGE_COLS}
    return df[[c for c in df.columns if c.lower() not in banned]]


def fit_schema(df):
    """Learn how each raw column is encoded. Call on TRAINING data only."""
    X = feature_frame(df)
    schema = {"columns": list(X.columns), "yn": [], "sex": [], "cat": {}}
    for c in X.columns:
        if _key(c) == "sex":
            schema["sex"].append(c)
            continue
        if pd.api.types.is_numeric_dtype(X[c]):
            continue
        vals = X[c].dropna().astype(str).str.strip()
        low = set(vals.str.lower())
        if low <= {"y", "n"}:
            schema["yn"].append(c)
        elif low <= {"male", "fmale", "female"}:
            schema["sex"].append(c)
        else:
            schema["cat"][c] = sorted(set(vals))
    return schema


def _map(v, mapping):
    if v is None or (not isinstance(v, str) and pd.isna(v)):
        return np.nan
    return mapping.get(str(v).strip().lower(), np.nan)


def apply_schema(df, schema):
    """Raw frame (any key style, any subset of columns) -> model-ready feature frame.

    Missing columns / unknown values become NaN and are imputed inside the pipeline.
    Leakage columns can never appear: output columns come only from schema['columns'].
    """
    lookup = {_key(c): c for c in df.columns}
    out = {}
    for c in schema["columns"]:
        src = lookup.get(_key(c))
        s = df[src] if src is not None else pd.Series([np.nan] * len(df), index=df.index, dtype=object)
        if c in schema["yn"]:
            out[c] = s.map(lambda v: _map(v, YN_MAP)).astype(float)
        elif c in schema["sex"]:
            out[c] = s.map(lambda v: _map(v, SEX_MAP)).astype(float)
        elif c in schema["cat"]:
            canon = {str(v).lower(): v for v in schema["cat"][c]}
            out[c] = s.map(lambda v, canon=canon: _map(v, canon)).astype(object)
        else:
            out[c] = pd.to_numeric(s, errors="coerce").astype(float)
    X = pd.DataFrame(out, index=df.index)
    assert_no_leakage(X)
    return X
