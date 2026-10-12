/**
 * SINGLE SOURCE OF TRUTH for the clinical inputs.
 * `key` is the exact Z-Alizadeh Sani column name the model was trained on. The assessment
 * form, the explanation labels and the report all read this list, so adding a feature to the
 * model only needs one new entry here.
 */
export type FeatureKind = "number" | "yesno" | "sex" | "select";

export interface FeatureDef {
  key: string;
  /** Plain-language label (patient-facing). */
  label: string;
  /** Clinical name shown in the technical view, e.g. "EF-TTE". Defaults to key. */
  clinical?: string;
  kind: FeatureKind;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Typical adult reference range, display only. */
  normal?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}

export interface FeatureGroup {
  id: string;
  title: string;
  blurb: string;
  features: FeatureDef[];
}

const yn = (key: string, label: string, hint?: string): FeatureDef => ({ key, label, kind: "yesno", hint });

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "profile",
    title: "Patient profile",
    blurb: "Demographics and body measurements. BMI and obesity are calculated for you.",
    features: [
      { key: "Age", label: "Age", kind: "number", unit: "yr", min: 18, max: 100 },
      { key: "Sex", label: "Sex", kind: "sex" },
      { key: "Weight", label: "Weight", kind: "number", unit: "kg", min: 30, max: 200 },
      { key: "Length", label: "Height", kind: "number", unit: "cm", min: 120, max: 220 },
    ],
  },
  {
    id: "history",
    title: "History & risk factors",
    blurb: "Known conditions. Leave anything you are unsure of as Unknown.",
    features: [
      yn("DM", "Diabetes"),
      yn("HTN", "High blood pressure (hypertension)"),
      yn("DLP", "High cholesterol (dyslipidaemia)"),
      yn("Current Smoker", "Current smoker"),
      yn("EX-Smoker", "Former smoker"),
      yn("FH", "Family history of heart disease"),
      yn("CRF", "Chronic kidney failure"),
      yn("CVA", "Previous stroke"),
      yn("CHF", "Heart failure"),
      yn("Thyroid Disease", "Thyroid disease"),
      yn("Airway disease", "Lung / airway disease"),
    ],
  },
  {
    id: "symptoms",
    title: "Symptoms & examination",
    blurb: "Bedside findings and vital signs.",
    features: [
      { key: "BP", label: "Blood pressure (systolic)", clinical: "BP", kind: "number", unit: "mmHg", min: 70, max: 240, normal: "90–120" },
      { key: "PR", label: "Pulse rate", clinical: "PR", kind: "number", unit: "bpm", min: 30, max: 200, normal: "60–100" },
      yn("LowTH Ang", "Low-threshold angina", "Chest pain brought on by very little effort."),
      yn("Dyspnea", "Shortness of breath"),
      {
        key: "Function Class", label: "Activity limitation (NYHA class)", kind: "select",
        options: [
          { value: "0", label: "None" }, { value: "1", label: "I · only on heavy effort" },
          { value: "2", label: "II · on ordinary activity" }, { value: "3", label: "III · on light activity" },
        ],
      },
      yn("Edema", "Swelling of the legs (oedema)"),
      yn("Weak Peripheral Pulse", "Weak pulse in the limbs"),
      yn("Lung rales", "Crackles on lung exam (rales)"),
      yn("Systolic Murmur", "Systolic murmur"),
      yn("Diastolic Murmur", "Diastolic murmur"),
    ],
  },
  {
    id: "ecg",
    title: "ECG",
    blurb: "Findings from the 12-lead ECG report.",
    features: [
      yn("Q Wave", "Pathological Q waves", "Sign of an old heart attack."),
      yn("St Elevation", "ST elevation"),
      yn("St Depression", "ST depression"),
      yn("Tinversion", "T-wave inversion"),
      yn("LVH", "Left ventricular hypertrophy"),
      yn("Poor R Progression", "Poor R-wave progression"),
      {
        key: "BBB", label: "Bundle branch block", kind: "select",
        options: [{ value: "N", label: "None" }, { value: "LBBB", label: "Left (LBBB)" }, { value: "RBBB", label: "Right (RBBB)" }],
      },
    ],
  },
  {
    id: "labs",
    title: "Laboratory",
    blurb: "Blood test results. Typical values are used for anything left blank.",
    features: [
      { key: "FBS", label: "Fasting blood sugar", kind: "number", unit: "mg/dL", normal: "70–100" },
      { key: "LDL", label: "LDL cholesterol (“bad”)", kind: "number", unit: "mg/dL", normal: "< 100" },
      { key: "HDL", label: "HDL cholesterol (“good”)", kind: "number", unit: "mg/dL", normal: "> 40" },
      { key: "TG", label: "Triglycerides", kind: "number", unit: "mg/dL", normal: "< 150" },
      { key: "CR", label: "Creatinine (kidney)", kind: "number", unit: "mg/dL", step: 0.1, normal: "0.6–1.2" },
      { key: "BUN", label: "Blood urea nitrogen", kind: "number", unit: "mg/dL", normal: "7–20" },
      { key: "ESR", label: "ESR (inflammation)", kind: "number", unit: "mm/h", normal: "< 20" },
      { key: "HB", label: "Haemoglobin", kind: "number", unit: "g/dL", step: 0.1, normal: "12–17" },
      { key: "K", label: "Potassium", kind: "number", unit: "mEq/L", step: 0.1, normal: "3.5–5.0" },
      { key: "Na", label: "Sodium", kind: "number", unit: "mEq/L", normal: "135–145" },
      { key: "WBC", label: "White blood cells", kind: "number", unit: "/µL", normal: "4000–11000" },
      { key: "Lymph", label: "Lymphocytes", kind: "number", unit: "%", normal: "20–40" },
      { key: "Neut", label: "Neutrophils", kind: "number", unit: "%", normal: "40–70" },
      { key: "PLT", label: "Platelets", kind: "number", unit: "×10³/µL", normal: "150–400" },
    ],
  },
  {
    id: "echo",
    title: "Echocardiogram",
    blurb: "From the heart ultrasound report.",
    features: [
      { key: "EF-TTE", label: "Heart pumping strength (ejection fraction)", clinical: "EF-TTE", kind: "number", unit: "%", min: 10, max: 80, normal: "55–70" },
      {
        key: "Region RWMA", label: "Heart-wall regions moving abnormally", clinical: "Region RWMA", kind: "select",
        hint: "Number of wall regions with abnormal motion (RWMA) on echo.",
        options: [0, 1, 2, 3, 4].map((n) => ({ value: String(n), label: n === 0 ? "None" : String(n) })),
      },
      {
        key: "VHD", label: "Heart valve disease", kind: "select",
        options: [{ value: "N", label: "None" }, { value: "mild", label: "Mild" }, { value: "Moderate", label: "Moderate" }, { value: "Severe", label: "Severe" }],
      },
    ],
  },
];

/**
 * Chest pain is ONE question in the UI but THREE one-hot columns in the dataset
 * (Typical Chest Pain / Atypical / Nonanginal). All three 0 = no chest pain.
 * `plain` / `plainHint` are the everyday wording used by the quick check.
 */
export const CHEST_PAIN = {
  key: "chestPain",
  label: "Chest pain type",
  columns: { typical: "Typical Chest Pain", atypical: "Atypical", nonanginal: "Nonanginal" } as Record<string, string>,
  options: [
    { value: "typical", label: "Typical angina", hint: "Pressure or tightness on effort or stress that eases with rest.",
      plain: "Yes, when I'm active or stressed", plainHint: "A pressure or tightness that goes away when I rest." },
    { value: "atypical", label: "Atypical", hint: "Some, but not all, features of heart-related pain.",
      plain: "Yes, but it comes and goes with no pattern", plainHint: "Not clearly linked to effort or rest." },
    { value: "nonanginal", label: "Non-anginal", hint: "Sharp pain, or pain that changes with breathing, movement or touch.",
      plain: "A sharp pain that changes when I breathe, move or press on it", plainHint: "Often from muscles or lungs, not the heart." },
    { value: "none", label: "No chest pain", hint: "The patient has no chest pain.",
      plain: "No chest pain", plainHint: "" },
  ],
};

/**
 * Smoking is one everyday question that sets two dataset columns.
 * `set` gives the values written to the form for Current Smoker / EX-Smoker.
 */
export const SMOKING = {
  question: "Do you smoke?",
  options: [
    { value: "never", label: "Never", set: { "Current Smoker": "no", "EX-Smoker": "no" } },
    { value: "former", label: "I used to", set: { "Current Smoker": "no", "EX-Smoker": "yes" } },
    { value: "current", label: "Yes, I smoke", set: { "Current Smoker": "yes", "EX-Smoker": "no" } },
  ],
};

/** Quick check, required part: the few questions that matter most and anyone can answer. */
export const QUICK_CORE_YES_NO: { key: string; question: string; hint?: string }[] = [
  { key: "DM", question: "Do you have diabetes?", hint: "Diagnosed by a doctor, or you take diabetes medicine." },
  { key: "HTN", question: "Have you been told you have high blood pressure?" },
];

/** Quick check, optional "more details" part. */
export const QUICK_MORE_YES_NO: { key: string; question: string }[] = [
  { key: "DLP", question: "Have you been told you have high cholesterol?" },
  { key: "FH", question: "Did a parent, brother or sister have heart disease?" },
  { key: "Dyspnea", question: "Do you get short of breath more easily than before?" },
  { key: "Edema", question: "Do your ankles or legs swell?" },
];

/** Derived in the browser, never typed. */
export const DERIVED: Record<string, string> = { BMI: "Body-mass index", Obesity: "Obesity (BMI ≥ 25)" };

export const ALL_FEATURES: FeatureDef[] = FEATURE_GROUPS.flatMap((g) => g.features);
const BY_KEY = new Map(ALL_FEATURES.map((f) => [f.key, f]));
export const featureDef = (key: string) => BY_KEY.get(key);
