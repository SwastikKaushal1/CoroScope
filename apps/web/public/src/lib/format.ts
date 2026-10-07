/** Display helpers: turn dataset column names into words a clinician or patient can read. */
export const MODEL_NAMES: Record<string, string> = {
  random_forest: "Random forest",
  xgboost: "XGBoost",
  logreg_l1: "L1 logistic regression",
};

const LABELS: Record<string, string> = {
  "EF-TTE": "Ejection fraction",
  DM: "Diabetes",
  HTN: "Hypertension",
  BP: "Systolic blood pressure",
  PR: "Pulse rate",
  CR: "Creatinine",
  BUN: "Blood urea nitrogen",
  HB: "Hemoglobin",
  Na: "Sodium",
  PLT: "Platelets",
  Lymph: "Lymphocytes",
  VHD: "Valvular heart disease",
  Length: "Height",
  "Region RWMA": "Wall-motion abnormality",
  Atypical: "Atypical chest pain",
  ESR: "Sedimentation rate (ESR)",
};
export const featureLabel = (f: string) => LABELS[f] ?? f;

const UNITS: Record<string, string> = { Age: "yr", BP: "mmHg", PR: "bpm", "EF-TTE": "%" };

export function fmtValue(feature: string, v: number | null): string {
  if (v === null) return "Estimated";
  // TODO: confirm this coding matches your form (1 = male?).
  if (feature === "Sex") return v === 1 ? "Male" : "Female";
  if (UNITS[feature]) return `${v} ${UNITS[feature]}`;
  if (v === 0 || v === 1) return v ? "Yes" : "No";
  return String(v);
}
