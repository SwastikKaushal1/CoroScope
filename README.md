# Coroscope: Cardiovascular Risk Visualization & Prediction

> **Multimodal AI Hackathon 2026 · Track A**
> Explainable machine-learning predictions of coronary artery disease (CAD) and per-vessel stenosis (LAD, LCX, RCA), mapped live onto an interactive 3D heart.

> ⚠️ **Clinical safety disclaimer.** This project is for **decision support and educational purposes only**. It is **not** a medical device and **not** a substitute for formal diagnostic imaging (coronary angiography, CT angiography) or professional clinical judgement. The 3D heart is a generic anatomical model, not a reconstruction of the patient.

**Quick start:** `docker compose up --watch`, then open <http://localhost:3000>.

---

## Contents

1. [What it does](#1-what-it-does)
2. [Results](#2-results)
3. [Architecture](#3-architecture)
4. [Setup and running](#4-setup-and-running)
5. [Using the app](#5-using-the-app)
6. [ML pipeline](#6-ml-pipeline)
7. [3D visualization pipeline](#7-3d-visualization-pipeline)
8. [API reference](#8-api-reference)
9. [Repository structure](#9-repository-structure)
10. [Extending the project](#10-extending-the-project)
11. [Limitations](#11-limitations)
12. [Credits and licenses](#12-credits-and-licenses)

Full technical write-up (≤ 6 pages): [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) · Demo video script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)

---

## 1. What it does

A risk percentage on its own doesn't tell a clinician or patient **where** disease may be developing, or **why** the model thinks so. Coroscope takes up to 55 routine demographic, clinical, ECG, laboratory and echocardiographic features and:

| Track A requirement | How Coroscope covers it |
|---|---|
| 1a–b Predict overall CAD and LAD / LCX / RCA stenosis | Four calibrated classifiers, one per target, each chosen from L1 logistic regression, random forest and XGBoost |
| 1c–d Use clinical features, exclude LAD/LCX/RCA/Cath | All 55 non-target columns used; target columns removed by a code assertion and unit tests |
| 1e Accuracy, precision, recall, F1, ROC-AUC | Reported on a held-out test set with bootstrap 95% CIs, plus PR-AUC, specificity, Brier score, ROC, calibration and confusion matrices (`/model` page) |
| 2a Interactive 3D heart (React Three Fiber) | Real heart mesh; coronary paths are ray-cast onto the surface |
| 2b Colour arteries by predicted probability | Each vessel fades green → amber → red, and high-risk vessels pulse |
| 2c Rotate, zoom, select regions | Orbit controls; hover and click a vessel (in 3D or the side panel) to focus the camera and switch the explanation |
| 3a Dashboard beside the canvas | Overall CAD verdict plus per-vessel probabilities and decision cut-offs |
| 3b SHAP / LIME breakdown | Per-patient SHAP for every target, with plain and technical views |
| 3c Measurements with their contribution | Table of every entered measurement: value, normal range and signed SHAP share |
| 4 Open-source anatomy | `.glb` heart model (see [credits](#12-credits-and-licenses)) |
| 5 Visible safety disclaimer | Persistent banner on every page, plus disclaimers in the API response and the PDF report |

**Extras:**
- **Heart age.** "You're 55, but your heart is like a 68-year-old's." Computed with the published Framingham office-based formula (D'Agostino 2008, verified against the CVrisk reference implementation), with the changes that would bring it down.
- **Share with your doctor (QR code).** The answers (never the name) are compressed into the link's `#` fragment, which browsers never send to a server. Scanning the QR re-runs the same models on the doctor's phone. The PDF report carries the same QR.
- **Your action plan.** The models re-run with realistic changes to the user's own answers (quit smoking, BP to 120, healthy weight, LDL below 100) and show the before → after risk.
- **Real dataset patients.** Load a real record in one click.
- **One-click PDF report**: a designed two-page A4 file with the 3D heart snapshot, plain-language reasons and a technical page for the doctor.
- **One-command Docker setup** with live reload.

## 2. Results

Held-out test set (20%, stratified, scored once after model selection). Thresholds are chosen on out-of-fold training predictions (Youden's J).

| Target | Model | Accuracy | Precision | Sensitivity | Specificity | F1 | **ROC-AUC** (95% CI) | CV ROC-AUC (5×5) |
|---|---|---|---|---|---|---|---|---|
| **CAD** | Random forest | 0.770 | 0.892 | 0.767 | 0.778 | 0.825 | **0.879** (0.77–0.97) | 0.933 ± 0.037 |
| **LAD** | Random forest | 0.754 | 0.784 | 0.806 | 0.680 | 0.795 | **0.841** (0.73–0.94) | 0.850 ± 0.048 |
| **LCX** | Random forest | 0.639 | 0.545 | 0.500 | 0.730 | 0.522 | **0.712** (0.58–0.84) | 0.740 ± 0.069 |
| **RCA** | L1 logistic regression | 0.738 | 0.652 | 0.652 | 0.789 | 0.652 | **0.792** (0.67–0.90) | 0.719 ± 0.072 |

A prior-only dummy baseline scores ROC-AUC 0.50 on every target. Top global SHAP drivers of overall CAD: typical chest pain, age, regional wall-motion abnormality, atypical chest pain, ejection fraction and fasting blood sugar. Interactive charts are on the `/model` page and the raw numbers are in [`apps/api/models/metrics.json`](apps/api/models/metrics.json).

Youden's J weighs sensitivity and specificity equally. A screening deployment would choose a lower, sensitivity-first cut-off; the probabilities are calibrated, so that is a one-line change. LCX and RCA are harder: fewer positives (119 and 114 of 303), and the tabular features carry weaker vessel-specific signal. The test-set confidence intervals are wide because the test set has only 61 patients.

## 3. Architecture

```
┌──────────────────────────── Browser · Next.js 16 + React 19 ────────────────────────────┐
│  /assess wizard ──► POST /predict ──► Zustand store ◄──► /results                        │
│  (55 features, presets)                  │               ├─ Verdict + ways to lower risk │
│                                          │               ├─ 3D scene (React Three Fiber)  │
│  /model ◄── GET /metrics                 └─ sessionStorage├─ SHAP + measurements panel   │
│  /report (A4 PDF via print)                               └─ LAD/LCX/RCA coloured by p   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                         │ JSON
┌──────────────────────── FastAPI · apps/api ──────────────────────────────────────────────┐
│ apply_schema (same encoder as training) → 4 calibrated pipelines → probabilities          │
│                                        → SHAP (Tree / Linear explainer) → per-feature     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                         ▲ joblib bundles + metrics.json
            python -m ml.train  (offline: CV, tuning, calibration, thresholds, evaluation)
                         ▲
              data/z_alizadeh_sani.csv (303 patients)
```

**Correspondence guarantee:** the vessel IDs `LAD`, `LCX`, `RCA` are the API's target keys, the keys in the frontend store and the IDs in [`config/arteries.ts`](apps/web/src/config/arteries.ts). Every 3D artery reads its colour from the prediction with the same key.

## 4. Setup and running

### Option A: Docker (recommended)

**Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose v2.22+).

```bash
git clone <this-repo> && cd Coroscope
docker compose up --watch
```

- Web app: <http://localhost:3000>
- API and interactive docs: <http://localhost:8000/docs>

Trained model weights are committed, so the app works straight away.

`--watch` turns on live reload. Edits under `apps/web` and `apps/api` sync into the containers: Next.js hot-reloads the page and uvicorn restarts the API. Changing `package.json` or `requirements.txt` rebuilds that image automatically.

Common tasks:

```bash
docker compose run --rm api python -m ml.train --tune   # retrain (a few minutes); writes apps/api/models/
docker compose exec api python -m pytest -q             # backend tests
docker compose -f compose.yaml -f compose.prod.yaml up --build   # optimized production build
docker compose down
```

### Option B: Manual

**Prerequisites:** Python 3.12, Node.js 22+.

```bash
# Backend
cd apps/api
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m ml.train --tune        # optional: weights are already in models/
uvicorn app.main:app --reload --port 8000

# Frontend (second terminal)
cd apps/web
npm ci
npm run dev                      # http://localhost:3000
```

The web app forwards `/api/*` to the API (same origin, no CORS), so it also works from a phone on the same network. Set `API_INTERNAL_URL` if the API isn't on `http://localhost:8000`.

## 5. Using the app

1. **Landing (`/`).** The 3D heart cycles through example profiles. `/results?demo` opens a real dataset patient without the backend.
2. **Assess (`/assess`).** Two modes share the same answers:
   - **Quick check (default, about 30 seconds).** Six everyday questions: age, sex, diabetes, high blood pressure, smoking, and chest pain in plain words. An optional, collapsed "more details" section adds height, weight, BP, pulse, cholesterol, family history, breathlessness and ankle swelling. Results based on few inputs carry a visible "rough guide" note.
   - **Clinical form (for doctors).** All 55 inputs, including ECG, labs and echo, in six steps. **High-risk / Low-risk patient** buttons fill every field from a real dataset record.

   Every field is optional; blanks use the training median and are flagged as *estimated*.
3. **Results (`/results`).**
   - Top: the answer in one sentence ("about 30 out of 100 people like you…") and the three arteries, next to the 3D heart.
   - The 3D heart: drag to rotate, scroll to zoom, and click a vessel to focus it.
   - **Your heart age** next to your real age, plus the changes that would lower it.
   - **Why this result?** The top reasons as plain sentences (from SHAP), with tabs for overall and each artery.
   - **Your action plan** (model-tested changes plus tailored, guideline-based steps) and next steps.
   - **Technical details for doctors** (collapsed): SHAP values, cut-offs and the physiological measurements table.
   - **Share** (header button): a QR code and link that open the same results on another device.
4. **Report (`/report`).** A two-page A4 report: page 1 for the patient (verdict, risk meter, heart age, 3D snapshot, arteries, and a QR code back to the interactive view), page 2 with reasons and a technical summary for the doctor. **Download PDF** saves the file directly; **Print** is also available.
5. **Model performance (`/model`).** Metrics table, ROC and calibration curves, confusion matrices, model comparison and global SHAP importance.

## 6. ML pipeline

Code: [`apps/api/ml/`](apps/api/ml). Full detail is in [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md).

1. **Encoding schema learned once** (`fit_schema`) and stored inside every model bundle. Training and serving use the same `apply_schema`, so a one-row API request is encoded exactly like the training data. Keys are flexible: `"ST Elevation"` and `"st_elevation"` both work.
2. **Leakage guard.** `LAD`, `LCX`, `RCA` and `Cath` can never enter the feature matrix: an assertion runs at training and inference, and unit tests cover it.
3. **80/20 stratified split.** The test set is used once.
4. **Model selection.** L1 logistic regression, random forest and XGBoost are compared by 5×5 repeated stratified CV on the training split, with imputation, scaling and one-hot encoding inside each fold. `--tune` adds a randomized hyper-parameter search.
5. **Calibration.** Platt (sigmoid) calibration with 5-fold internal CV, so the artery colours reflect probabilities rather than raw scores.
6. **Decision threshold.** Youden's J on out-of-fold calibrated predictions.
7. **Evaluation.** Accuracy, precision, sensitivity, specificity, F1, ROC-AUC with a 1,000-sample bootstrap CI, PR-AUC, Brier score, calibration curve and confusion matrix.
8. **Deployment.** Each target is refit on all 303 rows. The bundle holds the calibrated pipeline (for probabilities), the matching uncalibrated pipeline (for SHAP), the schema and the threshold.
9. **Explanations.** `TreeExplainer` (random forest, XGBoost) or `LinearExplainer` (logistic regression). One-hot columns are summed back to their source feature. A `share` value normalises across model types.

## 7. 3D visualization pipeline

Code: [`apps/web/src/components/three/`](apps/web/src/components/three).

- **Mesh.** `public/models/heart.glb` is normalised to a fixed height and centred. Normals are recomputed and averaged across UV seams. It uses a physically based material with clearcoat and sheen to look like tissue.
- **Coronary paths.** Hand-placed waypoints per vessel in `config/arteries.ts` are smoothed with Catmull-Rom splines, ray-cast onto the mesh surface (60 samples), smoothed again and drawn as tapered tubes.
- **Risk colour.** `riskColor(p)` blends green → amber → red, and the material fades to the new colour each frame without React re-renders. Vessels above 65% pulse.
- **Interaction.** OrbitControls (rotate and zoom). Hovering a vessel, in 3D or the side panel, highlights it. Clicking selects it, swings the camera to face it and switches the SHAP panel. Clicking empty space deselects.
- **Performance.** Pixel ratio is capped at 1.75 and there is no post-processing. A single shadow-casting light keeps the scene smooth on integrated GPUs.

## 8. API reference

Interactive docs: <http://localhost:8000/docs>.

| Route | Purpose |
|---|---|
| `POST /predict?top_k=10` | Raw features (any subset) → probabilities, thresholds and SHAP explanation per target |
| `GET /metrics` | Held-out and CV metrics, ROC and calibration curves, global SHAP importance, training metadata |
| `GET /schema` | Every input feature with its kind, range and median |
| `GET /presets` | Two real dataset patients (high and low risk) |
| `GET /health` | Model load status |

```bash
curl -X POST localhost:8000/predict?top_k=3 -H "Content-Type: application/json" \
  -d '{"Age": 62, "Sex": "Male", "DM": 1, "Typical Chest Pain": 1, "EF-TTE": 40}'
```

```jsonc
{
  "predictions": {
    "CAD": { "probability": 0.974, "threshold": 0.810, "predicted_positive": true, "risk_level": "high",
             "model": "random_forest",
             "explanation": [{ "feature": "Typical Chest Pain", "value": 1, "contribution": 0.159,
                               "share_pct": 33.2, "direction": "increases risk" }, ...] },
    "LAD": { ... }, "LCX": { ... }, "RCA": { ... }
  },
  "inputs": { "Age": 62, "Sex": 1, ... },          // what the model received
  "imputed_fields": ["Weight", ...],               // filled with training medians
  "ignored_fields": [],                            // unknown keys
  "disclaimer": "For decision support and educational purposes only. ..."
}
```

## 9. Repository structure

```
Coroscope/
├── compose.yaml / compose.prod.yaml   # dev (live reload) and production stacks
├── data/z_alizadeh_sani.csv       # dataset (UCI, CC BY 4.0)
├── docs/                              # DOCUMENTATION.md (≤6 pages), DEMO_SCRIPT.md
├── scripts/make_mock.py               # regenerate the offline demo result after retraining
└── apps/
    ├── api/                           # FastAPI + ML (Python 3.12)
    │   ├── app/main.py                # routes, request handling
    │   ├── app/explain.py             # per-patient and global SHAP
    │   ├── ml/preprocess.py           # schema, encoding, leakage guard (train AND serve)
    │   ├── ml/train.py                # CV, tuning, calibration, thresholds, export
    │   ├── ml/evaluate.py             # metrics, bootstrap CI, calibration curve
    │   ├── models/                    # trained bundles, metrics.json, presets.json, …
    │   └── tests/                     # leakage + API end-to-end tests (pytest)
    └── web/                           # Next.js 16 + React Three Fiber
        ├── public/models/heart.glb
        └── src/
            ├── app/                   # / · /assess · /results · /report · /model · /legal
            ├── components/three/      # Scene, Heart, Artery (blood flow, hotspot), Labels
            ├── components/results/    # Verdict, Reasons, LowerRisk (action plan), Explanation
            ├── components/assess/     # QuickCheck, ClinicalForm, Fields
            ├── components/report/     # two-page A4 report + PDF styles
            ├── config/arteries.ts     # vessel IDs + 3D paths (single source of truth)
            ├── config/features.ts     # clinical input catalog (single source of truth)
            ├── lib/                   # API client, form↔payload, formatting, risk colours
            └── store/useRiskStore.ts  # Zustand state shared by 3D and dashboard
```

## 10. Extending the project

- **New clinical feature.** Add the column to the dataset and retrain; the API picks it up from the learned schema. Then add one entry to `config/features.ts` to show it in the form, explanations and report.
- **New model.** Add it to `candidates()` in `ml/train.py` (and to `PARAM_DIST` for tuning). Selection, calibration and SHAP work automatically for tree and linear models.
- **New vessel (for example a diagonal branch).** Add the target column to `VESSELS` in `ml/preprocess.py`, then add an entry with waypoints to `config/arteries.ts`. The surface-snapping, colouring, labels and dashboard rows follow.
- **New heart mesh.** Replace `public/models/heart.glb`, then adjust waypoints using the `DEBUG_PICK` click-to-log tool in `Heart.tsx`.

## 11. Limitations

- **Small, single-centre dataset (303 patients).** Confidence intervals are wide and the models are not externally validated.
- **Tabular inputs only.** Predictions use clinical and ECG features, not imaging. RWMA is a feature, not a 3D lesion location.
- **Generic anatomy.** The 3D heart is a generic model and the coronary paths are schematic.
- **SHAP is not causation.** It explains the model's behaviour, not the patient's physiology.
- **Not for clinical use.** This prototype has not been validated for clinical decisions.

## 12. Credits and licenses

- **Dataset:** Z-Alizadeh Sani, *Extension of Z-Alizadeh Sani dataset*, UCI Machine Learning Repository, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Alizadehsani R. et al. Please cite the original authors.
- **3D heart model (`apps/web/public/models/heart.glb`):** **TODO: add author, source URL and license** before submission.
- **Libraries:** three.js, React Three Fiber, drei, Next.js, Tailwind CSS, Recharts, Zustand, FastAPI, scikit-learn, XGBoost, SHAP, pandas and NumPy, each under its own license.

---

*Built for the Multimodal AI Hackathon 2026, Track A.*
