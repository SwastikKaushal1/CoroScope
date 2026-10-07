/** Shape of the backend /predict response. Keep in sync with the FastAPI schema. */
export type Target = "CAD" | "LAD" | "LCX" | "RCA";

export interface Contribution {
  feature: string;
  /** null = the user did not enter it; the model filled it in (see imputed_fields). */
  value: number | null;
  contribution: number;
  share_pct: number;
  direction: "increases risk" | "decreases risk";
}

export interface TargetPrediction {
  probability: number; // 0..1
  predicted_positive: boolean;
  risk_level: string; // "low" | "moderate" | "high"
  model: string; // "random_forest" | "xgboost" | "logreg_l1"
  explanation: Contribution[];
}

export interface PredictionResponse {
  predictions: Record<Target, TargetPrediction>;
  /** Patient details for the report header. Your API fills this in; nobody types it in front of the patient. */
  patient?: Partial<Patient>;
  imputed_fields: string[];
  ignored_fields: string[];
  disclaimer: string;
}

/** Printed on the report. All optional text; edited on /report. */
export interface Patient {
  name: string;
  id: string;
  doctor: string;
  age: string;
  sex: string;
}
