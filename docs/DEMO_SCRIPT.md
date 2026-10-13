# Demo video script (about 6 minutes)

The submission requires a 3–10 minute YouTube video (unlisted is fine). It must show the project running and explain the approach, with English audio or subtitles. Record at 1080p with the browser full-screen. Before recording, start the stack with `docker compose up --watch` and load each page once, so the 3D model is cached.

| Time | Screen | Say |
|---|---|---|
| 0:00–0:30 | Landing page, hero heart cycling | "Cardiovascular disease kills about 18 million people a year. Risk scores give one number, but not *where* the disease is or *why*. Coroscope predicts coronary artery disease and stenosis in each of the three main arteries, LAD, LCX and RCA, and maps them onto a 3D heart with an explanation." |
| 0:30–1:00 | Scroll: How it works → vessels → explainability | "Routine clinical data goes into four calibrated models. Each artery is coloured by its own model's probability, and SHAP shows which measurements drove it." |
| 1:00–2:00 | `/assess`: answer the **six quick questions** (age, sex, diabetes, BP, smoking, chest pain), then open **"Have reports? Use the clinical form"** and click **High-risk patient** | "Anyone can do the quick check in about 30 seconds without medical reports; anything left blank uses typical values and is clearly flagged. Doctors can switch to the clinical form with all 55 inputs. Here I'll load a real dataset patient who was confirmed with CAD on angiography." |
| 2:00–3:15 | `/results`: read the verdict and meter, rotate and zoom the heart, tap an artery row, then the LCX label on the heart | "The answer comes first, in one sentence with a risk meter. Each artery is coloured by its own model, and blood flow visibly slows in arteries likely to be narrowed. Tapping an artery focuses the camera on it and switches the explanation to that artery." |
| 3:15–4:00 | "Why this result?" section, then open **Technical details for doctors** | "For patients, the reasons come as plain sentences: your blood pressure raised the risk, and so on. Doctors can open the technical panel with the raw SHAP values, the validated cut-offs and every measurement with its contribution." |
| 3:55–4:10 | **Your heart age** card | "One number anyone understands: a heart age. This person is 55, but their heart age is 80+. Quitting smoking and controlling blood pressure would bring it down to 73. It uses the published Framingham formula, so it's a validated number rather than one we made up." |
| 4:00–4:45 | Scroll to **Your action plan** | "Coroscope doesn't stop at a number. It re-runs the models with realistic changes to *your* answers, like quitting smoking or bringing blood pressure down to 120, and shows how much each could lower the risk. Here, all changes together take it from 30% to 16%." |
| 4:45–5:30 | `/model`: metrics tiles → table → ROC and calibration → confusion matrices → global SHAP | "Validation. The coronary target columns are never used as inputs, which is enforced in code and in tests. We held out 20% of patients and scored them once. Overall CAD reaches ROC-AUC 0.88 on that hold-out and 0.93 in cross-validation. LAD reaches 0.84. LCX and RCA are harder, and we report the confidence intervals honestly. The probabilities are calibrated, as this curve shows." |
| 5:20–5:30 | Click **Share**, then scan the QR code with a phone | "To share with a doctor, they scan this QR code and the same 3D heart opens on their phone. The answers travel inside the link, not your name, and nothing is stored on a server." |
| 5:30–5:50 | Click **Download report** → `/report` → **Download PDF** | "One click produces a two-page PDF: the result and the 3D heart for the patient, and a technical page for the doctor." |
| 5:50–6:10 | Code editor: `compose.yaml`, `ml/train.py`, `config/arteries.ts` | "The whole stack runs with one Docker command. The vessel list is defined once and shared by the API, the 3D scene and the dashboard, so a model output can never be painted on the wrong artery." |
| 6:10–6:30 | Landing page, zoom in on the disclaimer banner | "Coroscope is a decision-support and educational tool, not a diagnostic device. Thank you." |

**Checklist before uploading**
- [ ] The safety disclaimer is visible at least once on screen.
- [ ] Every Track A requirement is shown: the 3D model, the colour update, rotate/zoom/select, the dashboard, SHAP, measurements with contributions, and the metrics.
- [ ] The video is unlisted (not private) and has English subtitles or audio.
- [ ] The link is added to Devpost along with the GitHub repo, the project description and every teammate (real full names).
