# Coroscope: Technical Documentation

**Multimodal AI Hackathon 2026 · Track A: Cardiovascular Risk Visualization & Prediction**

> Decision support and educational use only. Not a substitute for formal diagnostic imaging or clinical judgement.

## 1. Overview

Coroscope predicts **overall coronary artery disease (CAD)** and **≥ 50% stenosis of the LAD, LCX and RCA** from routine clinical data. It maps each vessel probability onto an interactive 3D heart and explains every prediction with SHAP. The system has three parts:

1. **An offline training pipeline** (`apps/api/ml`). It selects, tunes, calibrates and evaluates one classifier per target and exports the model bundles with their metrics.
2. **A FastAPI service** (`apps/api/app`). It encodes any subset of clinical features exactly as in training and returns calibrated probabilities, validated decision cut-offs and per-feature SHAP attributions.
3. **A Next.js + React Three Fiber web app** (`apps/web`). It provides a guided input form, a 3D heart with risk-coloured coronaries, a clinical explanation dashboard, personalised "ways to lower your risk", a model-performance page and a printable report.

The whole stack starts with one command (`docker compose up --watch`), and source edits reload live.

## 2. Dataset and preprocessing

**Source.** The extension of the Z-Alizadeh Sani dataset (UCI, CC BY 4.0): 303 patients and 59 columns. Of these, 55 are input features covering demographics, history, examination, ECG, laboratory and echocardiography. The other 4 are targets: `LAD`, `LCX`, `RCA` (Stenotic/Normal) and `Cath` (CAD/Normal).

| Target | Positive | Negative | Prevalence |
|---|---|---|---|
| CAD (from `Cath`) | 216 | 87 | 71% |
| LAD | 177 | 126 | 58% |
| LCX | 119 | 184 | 39% |
| RCA | 114 | 189 | 38% |

**Leakage prevention.** `LAD`, `LCX`, `RCA` and `Cath` (and `CAD` if present) are dropped before any feature processing. `assert_no_leakage()` runs on every feature matrix at training and at inference. Four unit tests cover this:
- target columns are never in the features;
- the guard fires when it should;
- the saved bundles contain no target columns;
- sending target columns to the API does not change the prediction.

**Encoding schema (shared by training and serving).** `fit_schema()` learns from the training data how each raw column is encoded:
- numeric;
- Y/N flags → 1/0;
- sex → 1/0 (the dataset's `Fmale` spelling is handled);
- categorical (`BBB`, `VHD`) → one-hot.

The schema is saved inside every model bundle. The API calls the same `apply_schema()` on a one-row request, so serving cannot drift from training. For example, `VHD = "N"` stays the category "none" and is never misread as a Y/N flag. Keys are normalised, so `"ST Elevation"`, `"st_elevation"` and `"St Elevation"` are equivalent. Unknown keys are reported back, and missing values become NaN.

**In-pipeline preprocessing.** Each model is a scikit-learn `Pipeline`. Every fitted step therefore runs inside each cross-validation fold:
- median imputation for numeric columns and most-frequent imputation for categoricals;
- standardisation for the linear model only;
- one-hot encoding;
- removal of zero-variance columns (`Exertional CP` is constant in this dataset).

## 3. Model architecture and training

Each of the four targets gets its own independently selected model. The decision follows the brief, and it lets each vessel use the model family that suits it best.

**Candidates:**

| Model | Key settings |
|---|---|
| L1 logistic regression | `liblinear`, class-balanced, scaled inputs; sparse and interpretable |
| Random forest | 500 trees, `balanced_subsample` class weights |
| XGBoost | 300 shallow trees, `scale_pos_weight` for imbalance, L2 regularisation |

**Protocol** (`python -m ml.train --tune`, seed 42):

1. **Hold-out.** Stratified 80/20 split: 242 training and 61 test patients. The test set is scored **once**, after all choices are fixed.
2. **Tuning.** Randomized hyper-parameter search (15 draws, 5-fold CV, ROC-AUC) for each candidate, on the training split only.
3. **Selection.** 5×5 repeated stratified CV on the training split. The highest mean ROC-AUC wins, and ties within 0.005 go to the higher F1. A prior-only `DummyClassifier` is cross-validated as a baseline.
4. **Calibration.** The winner is wrapped in `CalibratedClassifierCV` (Platt/sigmoid, fitted on 5-fold out-of-fold predictions, `ensemble=False`). Sigmoid suits about 240 rows better than isotonic. Artery colours encode probabilities, so the probabilities need to mean what they say. `ensemble=False` keeps one refit model instead of averaging five, which cut serving latency from about 400 ms to about 130 ms for the live risk-reduction scenarios.
5. **Decision threshold.** Out-of-fold calibrated probabilities on the training split are used to pick the cut-off that maximises Youden's J (sensitivity + specificity − 1). Youden's J doesn't depend on prevalence, which matters because CAD is 71% positive and LCX only 39%. The test set is never used for this.
6. **Honest evaluation.** A calibrated model fitted on the training split only is scored on the test set at its validated threshold.
7. **Deployment.** The selected configuration is refit on all 303 rows. Each `models/<TARGET>.joblib` bundle holds:
   - the calibrated pipeline, used for probabilities;
   - the matching uncalibrated pipeline, used for SHAP;
   - a SHAP background matrix;
   - the encoding schema;
   - the threshold;
   - the scikit-learn version.

Training also writes `metrics.json`, `meta.json` (library versions, configuration), `feature_schema.json` (ranges and medians for forms) and `presets.json` (one high-risk and one low-risk real patient for demos).

**Selected models and tuned parameters:**

| Target | Model | Tuned parameters | Threshold |
|---|---|---|---|
| CAD | Random forest | max_depth 6, min_samples_leaf 1, max_features √p | 0.81 |
| LAD | Random forest | max_depth 6, min_samples_leaf 8, max_features √p | 0.59 |
| LCX | Random forest | max_depth 10, min_samples_leaf 8, max_features 0.3 | 0.47 |
| RCA | L1 logistic regression | C = 0.1 | 0.43 |

## 4. Evaluation results

**Held-out test set** (n = 61). ROC-AUC 95% CIs come from 1,000 bootstrap resamples.

| Target | Acc. | Precision | Sensitivity | Specificity | F1 | ROC-AUC (95% CI) | PR-AUC | Brier |
|---|---|---|---|---|---|---|---|---|
| CAD | 0.770 | 0.892 | 0.767 | 0.778 | 0.825 | **0.879** (0.77–0.97) | 0.941 | 0.113 |
| LAD | 0.754 | 0.784 | 0.806 | 0.680 | 0.795 | **0.841** (0.73–0.94) | 0.874 | 0.154 |
| LCX | 0.639 | 0.545 | 0.500 | 0.730 | 0.522 | **0.712** (0.58–0.84) | 0.562 | 0.211 |
| RCA | 0.738 | 0.652 | 0.652 | 0.789 | 0.652 | **0.792** (0.67–0.90) | 0.710 | 0.178 |

**Cross-validated ROC-AUC** (5×5 repeated, training split, mean ± SD). The dummy baseline scores 0.50 on every target.

| Target | L1 logistic regression | Random forest | XGBoost |
|---|---|---|---|
| CAD | 0.928 ± 0.035 | **0.933 ± 0.037** | 0.926 ± 0.039 |
| LAD | 0.835 ± 0.055 | **0.850 ± 0.048** | 0.847 ± 0.054 |
| LCX | 0.711 ± 0.075 | **0.740 ± 0.069** | 0.728 ± 0.077 |
| RCA | **0.719 ± 0.072** | 0.719 ± 0.055 | 0.712 ± 0.060 |

**Interpretation:**
- **CAD.** Overall CAD is predicted well: CV ROC-AUC 0.93, test ROC-AUC 0.88, precision 0.89. This is in line with published results on this dataset. Youden's J sets a balanced cut-off (sensitivity 0.77, specificity 0.78). A screening deployment would lower it to favour sensitivity; the probabilities are calibrated, so that only means changing the threshold.
- **LAD** is the most predictable vessel (ROC-AUC 0.84).
- **LCX and RCA** are harder (0.72–0.79). They have fewer positives, and the features describe the whole patient rather than a vessel territory.
- **Model choice.** The three model families are within about 0.02 AUC of each other on every target. The signal is mostly in the features, not in model complexity.
- **Uncertainty.** The CIs are wide because the test set has only 61 patients. We therefore report the 25-fold CV estimates alongside the test results, rather than a single headline number.

Confusion matrices, ROC curves and calibration plots for all four targets are on the app's `/model` page, served live from `GET /metrics`.

## 5. Explainability

**Per-patient attributions.** For every request, `TargetExplainer` computes SHAP values for each target:
- `TreeExplainer` for random forest and XGBoost;
- `LinearExplainer` with the training data as background for the L1 logistic model.

SHAP runs on the uncalibrated pipeline that matches the calibrated one, which is the same model refit on the same data. One-hot columns are summed back to their source feature, so VHD appears once rather than as VHD_mild or VHD_Moderate.

**Comparable units.** Raw SHAP units differ by model: probability for random forest, log-odds for logistic regression and XGBoost. The API therefore also returns `share_pct`, the feature's share of total |SHAP| for that prediction. The dashboard uses it for the "Major / Moderate / Minor" wording and the measurement table. The technical view shows the raw signed SHAP values with their units.

**Global importance.** Training stores the mean |SHAP| over all 303 patients for each target, shown on `/model`.
- **Overall CAD:** typical chest pain, age, regional wall-motion abnormality (RWMA), atypical chest pain, ejection fraction and fasting blood sugar. This matches known clinical risk factors.
- **RCA:** diabetes and sex rank highly.
- **LCX:** age, creatinine and platelets.

**In the dashboard (requirements 3b and 3c):**
- A diverging SHAP bar chart for the selected target: red raises risk, green lowers it. **Hatched bars** mark values the user didn't enter, which used the training median, so estimates are never shown as measurements.
- A physiological measurements table. It lists every entered value, its normal reference range, and its signed share of the selected target's explanation.
- Clicking a vessel in 3D or in the side panel switches both views to that vessel's model.

## 6. 3D visualization pipeline

- **Anatomy.** An open-source heart mesh (`public/models/heart.glb`, about 4 MB), loaded with `useGLTF`. The loader:
  - normalises the mesh to a fixed height and centres it;
  - recomputes normals and averages them across duplicated UV-seam vertices, which removes visible creases;
  - re-materials it with a physically based tissue shader: clearcoat for a wet surface and sheen for a soft rim.
- **Coronary geometry.** Each vessel in `config/arteries.ts` has 4–5 hand-placed waypoints. These are:
  1. smoothed with a Catmull-Rom spline;
  2. sampled at 60 points, and each point is ray-cast toward the centre onto the mesh surface (keeping the hit closest to the intended point, so vessels don't jump onto the aorta);
  3. lifted 0.005 units off the surface and smoothed again;
  4. drawn as tapered tubes with rounded caps.

  The vessels are children of the heart group, so they beat with it: a two-bump "lub-dub" scale animation at about 66 bpm.
- **Risk mapping.** `riskColor(p)` interpolates green → amber → red, with amber at 0.5. Each artery fades its material colour toward the target every frame, mutating the material directly with no React re-renders. Vessels with p ≥ 0.65 pulse with an emissive glow. A floating label shows the vessel name and its percentage.
- **Correspondence.** `LAD`, `LCX` and `RCA` are the API's prediction keys, the store's probability keys and the `ArteryDef.id` values. Each `<Artery>` reads `probabilities[def.id]`, so a model output can't be painted on the wrong vessel.
- **Interaction:**
  - OrbitControls: rotate and zoom, with an idle auto-rotate that stops on first touch.
  - Hover highlight, synchronised between the 3D view and the side panel.
  - Click to select. A camera rig swings to face the selected vessel and stops if the user grabs the heart.
  - Click empty space to deselect.
- **Performance.** The device-pixel ratio is capped at 1.75 and there is no post-processing. A single shadow-casting light and procedural Lightformer reflections (no HDR download) keep it at interactive frame rates on integrated GPUs.

## 7. System integration

**Data flow:**
1. `/assess` builds a payload from `config/features.ts`, the single catalog of inputs. It offers two modes:
   - a **quick check**: six everyday questions for patients (plus optional extras), no reports needed;
   - a **clinical form**: 50 questions covering all 55 model columns, for clinicians.

   Missing inputs are imputed with training medians, and results built from fewer than half the inputs are labelled as a rough guide. It also derives BMI and Obesity (in this dataset, Obesity is exactly BMI ≥ 25).
2. The payload goes to `POST /predict`.
3. The response is stored in a Zustand store, persisted to sessionStorage.
4. `/results` renders from the store: the 3D scene, the summary and the explanation all subscribe to it.

**Real-time updates.** "Your action plan" builds scenarios from the user's own answers: quitting smoking, systolic BP to 120, a healthy-weight BMI of 24.9, LDL below 100 and fasting glucose below 100, plus all of them combined. It re-runs all four models for each scenario in parallel and shows the before → after CAD probability. A full four-model prediction with SHAP takes about 130 ms round trip. Selecting an artery in 3D, in the artery list or in the "Why" tabs updates the heart and the explanation together through the shared store.

The results page reads top to bottom for non-medical users:
1. a one-sentence verdict ("about N out of 100 people like you…") and the three arteries beside the 3D heart;
2. plain-language reasons (SHAP, with the three chest-pain columns merged into one answer);
3. an action plan (model-tested changes plus tailored guideline-based steps) and next steps;
4. a collapsed technical panel for clinicians.

**Heart age.** The ML models estimate narrowed arteries *now* in a symptomatic hospital cohort, and their risk is nearly flat across age, so they cannot express a meaningful heart age. Heart age therefore uses the published Framingham office-based general CVD function (D'Agostino 2008): 10-year risk = 1 − S0^exp(L − mean), with L built from ln(age), ln(BMI), ln(SBP) (treated or untreated), smoking and diabetes. Heart age is the age at which a person with normal risk factors (SBP 125 untreated, BMI 22.5, non-smoker, no diabetes) has the same risk. The coefficients are checked against the CVrisk R package, and the implementation reproduces its reference case (55-year-old man, BMI 30, SBP 140 → 16.75%). Missing BP or weight is replaced by typical values and reported as assumed; the result shows as "80+" above 80 and is only given for ages 30–74, the range the formula was validated on.

**Sharing without a database.** The share link carries the model inputs (never the name) deflate-compressed in the URL fragment (`/results#s=…`, about 200–300 characters), which browsers never send to a server. Opening it re-runs the four models on the same answers. Next.js forwards `/api/*` to FastAPI (same origin, no CORS), so the link also works from a phone on the same network or on a deployed site.

**Other integration points:**
- `/model` reads `GET /metrics`, so the charts always reflect the deployed models.
- The landing page shows live AUCs from the same endpoint.
- `/report` renders a two-page A4 report (patient page and doctor page) with a snapshot of the current 3D view. **Download PDF** rasterises each page with html2canvas-pro and saves it with jsPDF, so the file matches the screen exactly.

**Engineering:**
- **Docker Compose.** API (Python 3.12) and web (Node 22) dev images use `develop.watch` sync for live reload. Production images use `next build` / `next start` and uvicorn without reload.
- **Pinned versions.** Python dependencies are pinned so the joblib models load with the exact scikit-learn version they were trained on.
- **Checks.** Backend: 12 pytest tests covering leakage, encoding, the API contract and preset ordering. Frontend: TypeScript strict mode and ESLint.

## 8. Usage

```bash
docker compose up --watch                                # http://localhost:3000, API on :8000/docs
docker compose run --rm api python -m ml.train --tune    # retrain and re-evaluate
docker compose exec api python -m pytest -q              # tests
```

1. Open the landing page and click **Check my heart**.
2. Enter values, or load the **high-risk** or **low-risk** dataset patient.
3. On the results page, rotate and zoom the heart and click a vessel. Read its SHAP drivers and the measurement table.
4. Read **Your action plan** to see how realistic changes could lower the predicted risk.
5. Click **Download report** for a PDF, or open **Model performance** for the full evaluation.

## 9. Limitations and future work

- **Small, single-centre cohort (303 patients).** The models are not externally validated, and the CIs are wide. Next step: validate on an external cohort and retrain on a larger multi-centre one.
- **Global features, local outcomes.** The tabular features describe the patient, not a vessel territory. RWMA region counts are not anatomical locations. Multi-label modelling (for example classifier chains that share CAD information across vessels) and imaging inputs (ECG waveforms, echo strain) are natural extensions toward the hackathon's multimodal theme.
- **Generic anatomy.** The heart is generic and the coronary paths are schematic. Patient-specific CT-derived meshes could be loaded through the same `ArteryDef` interface.
- **SHAP describes the model, not causation.**
- **This is not a medical device.**

## 10. References and credits

- Alizadehsani R. et al. *Extension of Z-Alizadeh Sani dataset*. UCI Machine Learning Repository (CC BY 4.0).
- Lundberg S. M. and Lee S.-I. (2017). *A Unified Approach to Interpreting Model Predictions*. NeurIPS.
- Platt J. (1999). *Probabilistic outputs for support vector machines*. Youden W. J. (1950). *Index for rating diagnostic tests*.
- WHO. *Cardiovascular diseases fact sheet*: 17.9 million deaths per year, 32% of global deaths.
- Software: scikit-learn, XGBoost, SHAP, FastAPI, Next.js, three.js, React Three Fiber, drei, Recharts, Zustand.
- 3D heart model: see README §12.
