"""CardioMap API: overall CAD + LAD / LCX / RCA stenosis predictions with SHAP explanations.

Routes
  GET  /health    models loaded, model type per target
  GET  /schema    input fields (kind, range, median) for building forms
  GET  /presets   two real dataset patients (high / low risk) for the demo buttons
  GET  /metrics   held-out + cross-validated evaluation, ROC, calibration, global SHAP
  POST /predict   raw clinical features -> probabilities + per-feature SHAP breakdown
"""
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.explain import TargetExplainer
from ml.preprocess import TARGETS, apply_schema

MODEL_DIR = Path(os.getenv("MODEL_DIR", Path(__file__).resolve().parents[1] / "models"))
RISK_BANDS = (0.33, 0.66)  # display bands: low < 0.33 <= moderate < 0.66 <= high
DISCLAIMER = ("For decision support and educational purposes only. Not a substitute "
              "for formal diagnostic imaging or clinical judgement.")

BUNDLES: dict = {}
EXPLAINERS: dict = {}


def load_models():
    missing = [t for t in TARGETS if not (MODEL_DIR / f"{t}.joblib").exists()]
    if missing:  # keep serving /health so the container is inspectable; /predict returns 503
        print(f"[api] models missing in {MODEL_DIR}: {missing}. Run: python -m ml.train")
        return
    for t in TARGETS:
        BUNDLES[t] = joblib.load(MODEL_DIR / f"{t}.joblib")
        EXPLAINERS[t] = TargetExplainer(BUNDLES[t])


@asynccontextmanager
async def lifespan(_app):
    load_models()
    yield


app = FastAPI(title="CardioMap 3D API", version="1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

def _read_json(name):
    path = MODEL_DIR / name
    if not path.exists():
        raise HTTPException(503, f"{name} not found. Train first: python -m ml.train")
    return json.loads(path.read_text())


def _plain(v):
    return v.item() if hasattr(v, "item") else v


def risk_level(p):
    return "low" if p < RISK_BANDS[0] else "moderate" if p < RISK_BANDS[1] else "high"


class PredictRequest(BaseModel):
    """Any subset of the dataset's feature names. Key style is flexible
    ('ST Elevation' == 'st_elevation'). Missing features are imputed with training medians/modes."""
    model_config = {"extra": "allow", "json_schema_extra": {"example": {
        "Age": 62, "Sex": "Male", "DM": 1, "HTN": 1, "BP": 150, "Typical Chest Pain": 1, "EF-TTE": 45}}}


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": bool(BUNDLES),
            "models": {t: b["model_name"] for t, b in BUNDLES.items()}}


@app.get("/schema")
def schema():
    return _read_json("feature_schema.json")


@app.get("/presets")
def presets():
    return _read_json("presets.json")


@app.get("/metrics")
def metrics():
    return {"targets": _read_json("metrics.json"), "meta": _read_json("meta.json")}


@app.post("/predict")
def predict(req: PredictRequest, top_k: int = Query(10, ge=1, le=60)):
    if not BUNDLES:
        raise HTTPException(503, "Models not trained yet. Run: python -m ml.train")
    features = {k: v for k, v in (req.model_extra or {}).items() if v is not None and v != ""}
    schema = BUNDLES["CAD"]["schema"]
    row = apply_schema(pd.DataFrame([features]), schema)
    provided = {c for c in row.columns if row[c].notna().iloc[0]}
    if not provided:
        raise HTTPException(422, "No recognised features supplied. See GET /schema.")
    known = {k.lower().replace(" ", "").replace("_", "").replace("-", "") for k in schema["columns"]}
    ignored = [k for k in features if k.lower().replace(" ", "").replace("_", "").replace("-", "") not in known]

    predictions = {}
    for t in TARGETS:
        b = BUNDLES[t]
        p = float(b["pipeline"].predict_proba(row)[0, 1])
        explanation = [{
            "feature": e["feature"],
            "value": _plain(e["input"]) if e["feature"] in provided else None,
            "contribution": round(e["shap"], 4),
            "share_pct": round(100 * abs(e["share"]), 1),
            "direction": "increases risk" if e["shap"] > 0 else "decreases risk",
        } for e in EXPLAINERS[t].explain(row)[:top_k]]
        predictions[t] = {
            "probability": round(p, 4),
            "threshold": round(float(b["threshold"]), 4),
            "predicted_positive": p >= b["threshold"],
            "risk_level": risk_level(p),
            "model": b["model_name"],
            "explanation": explanation,
        }

    return {
        "predictions": predictions,
        "inputs": {c: _plain(row[c].iloc[0]) for c in row.columns if c in provided},
        "imputed_fields": [c for c in schema["columns"] if c not in provided],
        "ignored_fields": ignored,
        "disclaimer": DISCLAIMER,
    }
