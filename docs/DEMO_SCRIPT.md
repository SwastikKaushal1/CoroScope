# Demo video script: slides + live demo (about 8 minutes)

The rules ask for a 3–10 minute YouTube video (unlisted is fine, private is not) that **shows the project running and explains the approach**, with English audio or subtitles. The judges wrote the Track A brief, so keep the topic short and spend most of the time on the working app.

| Part | Time | On screen |
|---|---|---|
| Problem and idea | ~1:30 | Slides 1–3 |
| **Live demo** | ~4:00 | The app |
| How it works and results | ~2:20 | Slides 5–10 |
| Limits and close | ~0:40 | Slides 11–12 |

**Before recording:** start the app (`docker compose up --watch` or `start.bat`), open every page once so the 3D heart is cached, use Chrome full screen at 1080p, close other tabs, and keep this script on a second screen or phone. The slide deck's speaker notes contain the same lines.

---

## Part 1: the problem and the idea (slides)

**Slide 1, Cover · 0:00–0:20**
"Hi, I'm Swastik Kaushal, and this is Coroscope, my entry for Track A of the Multimodal AI Hackathon: cardiovascular risk visualization and prediction. I'll show the problem in one slide, spend most of the time on the working app, and finish with how the models were built and how accurate they are."

**Slide 2, The problem · 0:20–1:00**
"Cardiovascular disease kills about 17.9 million people a year. Most risk tools turn a whole patient into one percentage. That number doesn't tell you which artery might be narrowed, why the model thinks so, or what to do next. And most of them ask for values a normal person doesn't know, like ejection fraction. Track A asks us to fix exactly this: predict CAD and the stenosis of the LAD, LCX and RCA arteries, map it onto a 3D heart, and explain it."

**Slide 3, What Coroscope does · 1:00–1:30**
"Coroscope works in four steps. You answer six everyday questions, with no medical reports. Four calibrated models estimate overall CAD and the chance of narrowing in each main artery. Every artery is painted on a 3D heart with its own model's risk. And every result comes with its reasons in plain words, a heart age, an action plan, a PDF and a QR code for your doctor. Let me show you."

## Part 2: live demo (the app) · 1:30–5:30

Show slide 4 ("Let's check a heart") for a second, then switch to the app.

1. **Quick check (40 s).** Landing page → **Check my heart**. "Anyone can do this in about 30 seconds." Enter: age 58, male, diabetes **Yes**, high blood pressure **Yes**, smoke **Yes, I smoke**, chest pain **"Yes, when I'm active or stressed"**. Open **Add more details**: blood pressure 150, height 172, weight 90. Click **See my results**.
2. **Result and 3D heart (60 s).** "The answer comes first: one sentence, a Low/Medium/High meter, and about N out of 100 people with answers like mine had narrowed arteries." Drag to rotate, scroll to zoom. "Each artery is coloured by its own model. Blood flow visibly slows in arteries likely to be narrowed." Tap the **Side and back (LCX)** row: "The camera turns to that artery and the explanation switches to it."
3. **Heart age (20 s).** "One number anyone understands. The published Framingham formula gives my heart age, and shows what would bring it down."
4. **Why this result? (30 s).** "Reasons in plain sentences, from SHAP: my chest pain raised the risk a lot, diabetes raised it a little." Click the **Front** tab. Open **Technical details for doctors**: "Doctors get raw SHAP values, validated cut-offs and every measurement with its normal range."
5. **Action plan (20 s).** "The models re-run with realistic changes to my own answers, like blood pressure down to 120 or quitting smoking, before and after. Plus tailored steps, like seeing a doctor soon about chest pain."
6. **Share by QR (20 s).** Click **Share**. "My doctor scans this QR and the same 3D heart opens on their phone. The answers travel inside the link, never my name, and nothing is stored on a server."
7. **PDF report (20 s).** Click **Download report** → **Download PDF**. "A two-page A4 report: the result and the 3D heart for me, a technical page for the doctor, and a QR back to the live view."
8. **Optional (20 s).** **New check** → **Have reports? Use the clinical form** → **High-risk patient**. "Doctors can enter all 55 values, or load a real patient confirmed by angiography."

Switch back to the slides.

## Part 3: how it works and results (slides)

**Slide 5, The data · 5:30–5:50**
"The models learn from the extended Z-Alizadeh Sani dataset: 303 patients whose arteries were checked by angiography, 55 clinical inputs and four targets. As the brief requires, LAD, LCX, RCA and Cath are never used as inputs. That's enforced in code and covered by unit tests."

**Slide 6, Validation · 5:50–6:20**
"20% of patients were locked away first. On the rest, L1 logistic regression, random forest and XGBoost were compared with five-by-five repeated cross-validation. The winner is calibrated, so a 70% really means about 70 in 100. The cut-off is chosen on out-of-fold data, never the test set. Only then is each model scored once on the locked 20%, with bootstrap confidence intervals. Retraining from scratch reproduces exactly the same numbers."

**Slide 7, Results · 6:20–6:55**
"On those unseen patients, overall CAD reaches a ROC-AUC of 0.88, and 0.93 in cross-validation. The front artery, LAD, reaches 0.84. LCX and RCA are harder, at 0.71 and 0.79: fewer positive cases, and features that describe the whole patient rather than one artery. 0.5 is a coin flip. The test set has 61 patients, so we report the confidence intervals honestly. The app's Accuracy page has the full ROC curves, calibration plots and confusion matrices."

**Slide 8, Explainability · 6:55–7:15**
"Every prediction is explained with SHAP. Patients see plain sentences, only for things they told us. Doctors get raw SHAP values, the validated cut-off and every measurement with its contribution."

**Slide 9, Beyond the prediction · 7:15–7:30**
"It's built for real people: blood flow on the 3D heart, a Framingham heart age, an action plan re-tested on your own answers, QR sharing without storing anything, a PDF report, and safety built in."

**Slide 10, Architecture · 7:30–7:50**
"Next.js and React Three Fiber in the browser, a FastAPI service with the same encoder as training, about 130 milliseconds for all four predictions with SHAP. One docker compose command runs it, the trained models are in the repo, and arteries and inputs are each defined once."

## Part 4: limits and close (slides)

**Slide 11, Honest limits · 7:50–8:10**
"Coroscope is not a diagnosis; a notice says so on every page, in the API and in the PDF. The models learned from 303 patients at one hospital and aren't validated elsewhere yet. They use clinical data, not imaging, and SHAP explains the model, not the patient's biology."

**Slide 12, Thank you · 8:10–8:30**
"Next, I'd like to fill the form from a photo of a lab report, answer by voice in English and Hindi, and validate on a multi-centre cohort. The code, models and documentation are on GitHub at github.com/SwastikKaushal1/CoroScope. Thank you for watching."

---

**Checklist before uploading**
- [ ] The safety disclaimer is visible on screen at least once (top banner in the app, slide 11).
- [ ] Every Track A requirement is shown: predictions, the 3D heart and colour update, rotate/zoom/select, the dashboard, SHAP, measurements with contributions, and the metrics.
- [ ] Length is between 3 and 10 minutes.
- [ ] The video is **Unlisted** (not Private) and has English audio or subtitles.
- [ ] The link is in the README and the submission form, along with the repo and your real full name.
