# CardioMap 3D — Cardiovascular Risk Visualization & Prediction

> **Multimodal AI Hackathon 2026 · Track A**
> Interactive 3D coronary artery visualization driven by machine-learning predictions of Coronary Artery Disease (CAD) and per-vessel stenosis (LAD, LCX, RCA), with per-patient explanations.

> ⚠️ **Clinical safety disclaimer.** This project is for **decision-support and educational purposes only**. It is **not** a medical device and **not** a substitute for formal diagnostic imaging (e.g., coronary angiography or CT angiography) or professional clinical judgement. The 3D anatomy is a **schematic**, not a patient-specific reconstruction.

---

## Table of contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [System architecture](#3-system-architecture)
4. [Tech stack](#4-tech-stack)
5. [Repository structure](#5-repository-structure)
6. [Dataset](#6-dataset)
7. [ML pipeline](#7-ml-pipeline)
8. [3D visualization pipeline](#8-3d-visualization-pipeline)
9. [API reference](#9-api-reference)
10. [Setup and installation](#10-setup-and-installation)
11. [Usage](#11-usage)
12. [Evaluation results](#12-evaluation-results)
13. [Extending the project](#13-extending-the-project)
14. [Roadmap / task checklist](#14-roadmap--task-checklist)
15. [Limitations](#15-limitations)
16. [Credits and licenses](#16-credits-and-licenses)

---

## 1. Overview

Risk percentages alone give clinicians and patients little intuition about *where* disease may be developing. CardioMap 3D takes a patient's demographic, clinical, laboratory, ECG and echocardiographic features, predicts:

- **Overall CAD status**
- **Stenosis status of the LAD, LCX and RCA**

and maps those probabilities onto an interactive 3D heart. Each coronary artery is color-coded by predicted risk, and a clinical dashboard explains *why* the model produced each prediction (SHAP).

## 2. Features

| Area | Feature |
|---|---|
| Prediction | 4 binary classifiers (CAD, LAD, LCX, RCA), leakage-safe inputs |
| 3D viewer | Rotate, zoom, pan, hover highlight, click-to-select vessel |
| Risk mapping | Artery color updates live from predicted probability (green → amber → red) |
| Dashboard | Overall CAD status, vessel probability cards, SHAP breakdown, measurement table with contributions |
| Input | Grouped clinical form + preset patients (high-risk / low-risk) |
| Metrics tab | Accuracy, precision, recall, F1, ROC-AUC, ROC curves, confusion matrices |
| Safety | Persistent, visible disclaimer banner |
| Performance | Low-poly meshes, no post-processing, runs without a dedicated GPU |

## 3. System architecture

```
┌─────────────────────────────── Browser (Next.js) ───────────────────────────────┐
│                                                                                 │
│  PatientForm ──► Zustand store ◄──► Dashboard (RiskCards, ShapChart, Table)     │
│       │          (patient, prediction,            ▲                             │
│       │           selectedVessel)                 │                             │
│       │                 ▲                         │                             │
│       │                 └──────► 3D Scene (React Three Fiber)                   │
│       │                          Heart shell + LAD / LCX / RCA arteries         │
└───────┼─────────────────────────────────────────────────────────────────────────┘
        │ POST /predict (JSON)
        ▼
┌──────────────────────────────── FastAPI backend ────────────────────────────────┐
│  Pydantic validation → preprocessing pipeline → 4 trained models                │
│        → probabilities + SHAP values + feature contributions → JSON             │
└─────────────────────────────────────────────────────────────────────────────────┘
        ▲
        │ offline: train.py (CV, tuning, evaluation, export of weights + metrics)
   Z-Alizadeh Sani dataset
```

**Key design rule:** the artery list (`LAD`, `LCX`, `RCA`) is defined once in a config file and used by the backend schema, the 3D scene and the dashboard, so model outputs and displayed anatomy always correspond.

## 4. Tech stack

### Frontend
| Purpose | Technology |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| 3D rendering | three.js, `@react-three/fiber`, `@react-three/drei` |
| Model tooling | `gltfjsx`, `gltf-transform` / Blender (decimation, mesh naming, Draco) |
| UI | Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| State | Zustand |
| Validation | Zod |

### Backend / ML
| Purpose | Technology |
|---|---|
| API | FastAPI, Uvicorn, Pydantic |
| ML | scikit-learn, XGBoost / LightGBM |
| Explainability | SHAP (TreeExplainer) |
| Data | pandas, NumPy |
| Persistence | joblib (model weights), JSON (metrics) |
| Testing | pytest |

### Tooling
Node 20+, Python 3.10+, ESLint/Prettier, Ruff.

## 5. Repository structure

```
cardiomap-3d/
├── README.md
├── LICENSE
├── docs/
│   ├── report.md                 # 6-page project documentation source
│   └── images/
├── data/
│   ├── raw/                      # original dataset (not committed if license requires)
│   └── processed/
├── apps/
│   ├── api/                      # FastAPI + ML
│   │   ├── requirements.txt
│   │   ├── app/
│   │   │   ├── main.py           # FastAPI entrypoint, CORS, routes
│   │   │   ├── schemas.py        # Pydantic request/response models
│   │   │   ├── config.py         # features, targets, vessel list
│   │   │   ├── predict.py        # load models, run inference
│   │   │   └── explain.py        # SHAP computation per patient
│   │   ├── ml/
│   │   │   ├── preprocess.py     # cleaning, encoding, leakage guard
│   │   │   ├── train.py          # CV, model selection, export
│   │   │   ├── evaluate.py       # metrics, ROC, confusion matrices
│   │   │   └── notebooks/        # EDA
│   │   ├── models/               # saved weights + metrics.json
│   │   └── tests/
│   └── web/                      # Next.js app
│       ├── package.json
│       ├── public/models/        # heart.glb (+ license notes)
│       └── src/
│           ├── app/              # pages / layout
│           ├── components/
│           │   ├── three/        # Scene, Heart, Artery, Controls, Labels
│           │   └── dashboard/    # Disclaimer, RiskCards, ShapChart,
│           │                     # PatientForm, MeasurementTable, MetricsTab
│           ├── config/
│           │   ├── arteries.ts   # id, label, curve/mesh name, color rules
│           │   └── features.ts   # feature groups, labels, ranges, units
│           ├── lib/              # api client, riskColor(), formatters
│           ├── store/            # Zustand store
│           ├── mocks/            # mock /predict responses
│           └── types/            # shared TS types mirroring API schemas
└── scripts/                      # helper scripts (setup, export, demo data)
```

## 6. Dataset

- **Source:** Extension of the **Z-Alizadeh Sani** dataset (UCI Machine Learning Repository, also on Kaggle).
- **Size:** 303 patient records.
- **Inputs:** demographics, clinical examination, laboratory values, ECG findings (e.g., ST Elevation, T Inversion, LVH), echocardiographic findings (e.g., Region with RWMA).
- **Targets:** overall CAD status, and stenosis status for **LAD**, **LCX**, **RCA**.
- **Definition:** CAD corresponds to ≥ 50% narrowing in one or more major coronary vessels, per the dataset definition.

### Leakage prevention

`LAD`, `LCX`, `RCA` and `Cath` are **excluded from the input features** whenever any CAD or vessel target is predicted. `preprocess.py` enforces this with an explicit assertion, and a unit test fails if a target column ever appears in the feature matrix.

> Column names and encodings will be verified when the dataset is loaded; the list above may need small adjustments.

## 7. ML pipeline

1. **Preprocessing:** type fixes, binary/categorical encoding, scaling where needed, missing-value handling, leakage guard.
2. **Models per target:** logistic regression (baseline), random forest, XGBoost/LightGBM; optional ensemble.
3. **Validation:** stratified, repeated k-fold cross-validation (small dataset, imbalanced labels), with all preprocessing fitted inside folds to avoid leakage. A held-out test set is reserved for the final report.
4. **Model selection:** per target by cross-validated ROC-AUC (ties broken by F1).
5. **Metrics:** accuracy, precision, recall, F1, ROC-AUC, plus confusion matrices and ROC curves.
6. **Calibration:** reliability check so probabilities shown on the artery colors are meaningful.
7. **Explainability:** SHAP values computed per patient and per target at request time.
8. **Export:** model weights (`joblib`) and `metrics.json` saved under `apps/api/models/`.

## 8. 3D visualization pipeline

- **Scene:** React Three Fiber `<Canvas>` with `OrbitControls` (rotate, zoom, pan), simple lighting, and a translucent heart shell.
- **Arteries:** LAD, LCX and RCA are separate named objects, each with its own material. Two supported modes:
  - **Procedural (default):** tube geometries along hand-defined curves on the heart surface.
  - **Mesh mode:** use a decimated open-source `.glb` whose coronary arteries are separate named meshes.
- **Risk coloring:** `riskColor(probability)` maps 0–1 to a green → amber → red scale, applied to each artery material when a new prediction arrives.
- **Interaction:** hover highlight, click to select a vessel, camera focus, and a detail panel with probability and top SHAP drivers for that vessel.
- **Performance:** low triangle count, Draco-compressed assets, no heavy post-processing.

## 9. API reference

### `POST /predict`

**Request** (abridged; full feature list in `apps/api/app/config.py`):

```json
{
  "age": 62,
  "sex": "Male",
  "bmi": 28.4,
  "bp": 150,
  "pr": 78,
  "typical_chest_pain": 1,
  "st_elevation": 1,
  "t_inversion": 0,
  "region_rwma": 2
}
```

**Response**

```json
{
  "cad": { "probability": 0.87, "label": "CAD" },
  "vessels": {
    "LAD": { "probability": 0.74 },
    "LCX": { "probability": 0.31 },
    "RCA": { "probability": 0.58 }
  },
  "shap": {
    "CAD": [{ "feature": "Typical Chest Pain", "value": 0.21 }],
    "LAD": [{ "feature": "ST Elevation", "value": 0.17 }]
  },
  "patient": [{ "feature": "Age", "value": 62, "contribution": 0.08 }]
}
```

### `GET /metrics`
Returns evaluation metrics for each target (accuracy, precision, recall, F1, ROC-AUC, ROC curve points, confusion matrix).

### `GET /health`
Returns service and model-load status.

## 10. Setup and installation

### Prerequisites
- Node.js 20+ and npm (or pnpm)
- Python 3.10+
- Git

### Backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Train models and export weights + metrics
python -m ml.train

# Start API
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd apps/web
npm install
cp .env.example .env.local       # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open <http://localhost:3000>.

**Mock mode:** set `NEXT_PUBLIC_USE_MOCK=true` to run the frontend without the backend, using responses from `src/mocks/`.

## 11. Usage

1. Open the app and read the disclaimer banner.
2. Choose a preset patient (high-risk or low-risk) or fill in the clinical form.
3. Submit to run the prediction.
4. Watch the LAD, LCX and RCA arteries recolor by predicted stenosis probability.
5. Rotate, zoom, and click an artery to open its detail panel.
6. Review the SHAP breakdown and measurement contributions.
7. Open the Metrics tab for model evaluation.

## 12. Evaluation results

> Placeholder — to be filled in after training. No results are claimed yet.

| Target | Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|---|
| CAD | – | – | – | – | – | – |
| LAD | – | – | – | – | – | – |
| LCX | – | – | – | – | – | – |
| RCA | – | – | – | – | – | – |

Validation: stratified repeated k-fold CV plus held-out test set (details to be documented).

## 13. Extending the project

- **New clinical feature:** add it to `apps/api/app/config.py` and `apps/web/src/config/features.ts`, retrain.
- **New model:** add it to the candidate list in `ml/train.py`; selection is automatic.
- **New anatomical structure (e.g., a branch artery):** add an entry to `config/arteries.ts` and, if used, the target list in the backend config.
- **New heart mesh:** drop a `.glb` into `public/models/`, set the mesh-name mapping in `arteries.ts`.



## 14. Limitations

- Small dataset (303 records): estimates are uncertain and may not generalize.
- Predictions come from tabular clinical features, not imaging.
- The 3D heart is schematic; RWMA and other features do not provide a pixel-level or 3D lesion map.
- SHAP explains the model's behavior, not causal mechanisms.
- Not validated for clinical use.

## 15. Credits and licenses

- **Dataset:** Z-Alizadeh Sani (UCI Machine Learning Repository). Please cite the original authors.
- **3D models:** list each model, author, source URL and license here, and verify each license before redistribution (e.g., BodyParts3D, Sketchfab models).
- **Libraries:** three.js, React Three Fiber, drei, FastAPI, scikit-learn, XGBoost, SHAP and others under their respective licenses.
- **Project license:** TBD (e.g., MIT).

---

*Built for the Multimodal AI Hackathon 2026, Track A.*
