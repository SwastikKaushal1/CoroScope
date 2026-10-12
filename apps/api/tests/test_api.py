"""End-to-end API checks against the trained models. Run from apps/api:  python -m pytest -q"""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

MODELS = Path(__file__).resolve().parents[1] / "models"
pytestmark = pytest.mark.skipif(not (MODELS / "CAD.joblib").exists(), reason="train first")


@pytest.fixture(scope="module")
def client():
    from app.main import app
    with TestClient(app) as c:
        yield c


def test_health(client):
    body = client.get("/health").json()
    assert body["models_loaded"] and set(body["models"]) == {"CAD", "LAD", "LCX", "RCA"}


def test_predict_shape_and_ranges(client):
    r = client.post("/predict", json={"Age": 62, "Sex": "Male", "DM": 1, "Typical Chest Pain": 1, "EF-TTE": 40})
    assert r.status_code == 200
    body = r.json()
    for t in ["CAD", "LAD", "LCX", "RCA"]:
        p = body["predictions"][t]
        assert 0 <= p["probability"] <= 1
        assert p["predicted_positive"] == (p["probability"] >= p["threshold"])
        assert p["explanation"], "SHAP explanation missing"
    assert "Age" in body["inputs"] and "FBS" in body["imputed_fields"]


def test_flexible_keys_and_ignored(client):
    body = client.post("/predict", json={"st_elevation": 1, "t inversion": 1, "not_a_feature": 3}).json()
    assert body["inputs"]["St Elevation"] == 1 and body["inputs"]["Tinversion"] == 1
    assert body["ignored_fields"] == ["not_a_feature"]


def test_targets_rejected_as_inputs(client):
    """Supplying target columns must not change the prediction (no leakage path through the API)."""
    base = {"Age": 55, "Sex": "Female"}
    a = client.post("/predict", json=base).json()["predictions"]
    b = client.post("/predict", json={**base, "LAD": "Stenotic", "Cath": "Cad"}).json()["predictions"]
    assert all(a[t]["probability"] == b[t]["probability"] for t in a)


def test_presets_rank_risk(client):
    presets = client.get("/presets").json()
    hi = client.post("/predict", json=presets["high_risk"]).json()["predictions"]["CAD"]["probability"]
    lo = client.post("/predict", json=presets["low_risk"]).json()["predictions"]["CAD"]["probability"]
    assert hi > lo


def test_empty_payload_rejected(client):
    assert client.post("/predict", json={}).status_code == 422


def test_metrics(client):
    m = client.get("/metrics").json()
    assert {"accuracy", "precision", "recall", "f1", "roc_auc"} <= set(m["targets"]["CAD"]["test"])
