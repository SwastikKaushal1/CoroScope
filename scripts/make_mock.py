"""Regenerate apps/web/src/lib/mockResult.ts from the running API (after retraining).

Usage (API running on :8000):  python scripts/make_mock.py
"""
import json
import urllib.request
from pathlib import Path

API = "http://localhost:8000"
OUT = Path(__file__).resolve().parents[1] / "apps/web/src/lib/mockResult.ts"

preset = {k: v for k, v in json.load(urllib.request.urlopen(f"{API}/presets"))["high_risk"].items() if v is not None}
req = urllib.request.Request(f"{API}/predict?top_k=60", data=json.dumps(preset).encode(),
                             headers={"Content-Type": "application/json"})
result = json.load(urllib.request.urlopen(req))
result["patient"] = {"name": "Demo patient (dataset record)", "age": str(preset["Age"]),
                     "sex": "Male" if preset["Sex"] == "Male" else "Female"}

OUT.write_text('''import type { PredictionResponse } from "./types";

/**
 * A real /predict response for the high-risk dataset patient (GET /presets), saved so the
 * results page can be previewed with /results?demo, or used offline when the API is down.
 * Regenerate after retraining: python scripts/make_mock.py
 */
export const MOCK_RESULT: PredictionResponse = ''' + json.dumps(result, indent=1) + ";\n", encoding="utf-8")
print(f"wrote {OUT}")
