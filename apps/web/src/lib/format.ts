/** Display helpers: turn dataset column names into words a patient can read. */
const LABELS: Record<string, string> = {
  "EF-TTE": "Heart pumping strength",
  DM: "Diabetes",
  HTN: "High blood pressure",
  BP: "Blood pressure (top number)",
  PR: "Pulse rate",
  CR: "Creatinine (kidney test)",
  BUN: "Blood urea nitrogen",
  HB: "Hemoglobin",
  Na: "Sodium",
  PLT: "Platelets",
  Lymph: "Lymphocytes",
  VHD: "Heart valve disease",
  Length: "Height",
  "Region RWMA": "Weak heart-wall movement",
  Atypical: "Unusual chest pain",
  ESR: "Inflammation test (ESR)",
  "Typical Chest Pain": "Typical chest pain",
  HDL: "Good cholesterol (HDL)",
  LDL: "Bad cholesterol (LDL)",
  Dyspnea: "Shortness of breath",
  "Function Class": "Daily activity limits",
  Age: "Age",
  Sex: "Sex",
};
export const featureLabel = (f: string) => LABELS[f] ?? f;

const UNITS: Record<string, string> = { Age: "yr", BP: "mmHg", PR: "bpm", "EF-TTE": "%" };

export function fmtValue(feature: string, v: number | null): string {
  if (v === null) return "Estimated";
  if (feature === "Sex") return v === 1 ? "Male" : "Female";
  if (UNITS[feature]) return `${v} ${UNITS[feature]}`;
  if (v === 0 || v === 1) return v ? "Yes" : "No";
  return String(v);
}

/** Turns a factor's share of the explanation into a plain word instead of a percentage. */
export const influenceWord = (sharePct: number) => (sharePct >= 15 ? "Major" : sharePct >= 7 ? "Moderate" : "Minor");
