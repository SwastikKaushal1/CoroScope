/** Shape of the backend /predict response. Keep in sync with apps/api/app/main.py. */
export type Target = "CAD" | "LAD" | "LCX" | "RCA";
export type FeatureValue = number | string;
export type Payload = Record<string, FeatureValue>;

export interface Contribution {
  feature: string;
  /** null = the user did not enter it; the model filled it in (see imputed_fields). */
  value: FeatureValue | null;
  /** Signed SHAP value (model units: log-odds for logreg / XGBoost, probability for random forest). */
  contribution: number;
  /** |SHAP| as a % of the total |SHAP| for this prediction, comparable across models. */
  share_pct: number;
  direction: "increases risk" | "decreases risk";
}

export interface TargetPrediction {
  probability: number; // 0..1, calibrated
  /** Decision cut-off chosen on out-of-fold training data (Youden's J). */
  threshold: number;
  predicted_positive: boolean;
  risk_level: "low" | "moderate" | "high";
  model: string; // "random_forest" | "xgboost" | "logreg_l1"
  explanation: Contribution[];
}

export interface PredictionResponse {
  predictions: Record<Target, TargetPrediction>;
  /** Values the model actually received (dataset column names). */
  inputs: Payload;
  /** Patient details for the report header (never sent to the model). */
  patient?: Partial<Patient>;
  imputed_fields: string[];
  ignored_fields: string[];
  disclaimer: string;
}

/** Printed on the report. All optional text. */
export interface Patient {
  name: string;
  id: string;
  doctor: string;
  age: string;
  sex: string;
}

/* ---------------- /metrics ---------------- */
export interface MeanStd { mean: number; std: number }
export interface TestMetrics {
  threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1: number;
  roc_auc: number;
  pr_auc: number;
  brier: number;
  confusion_matrix: [[number, number], [number, number]];
  roc_auc_ci95: [number, number];
  roc_curve: { fpr: number[]; tpr: number[] };
  calibration: { prob_pred: number[]; prob_true: number[] };
}
export interface TargetMetrics {
  model: string;
  threshold: number;
  n_pos: number;
  n_neg: number;
  cv: Record<string, Record<"roc_auc" | "f1" | "accuracy" | "precision" | "recall", MeanStd>>;
  cv_baseline_dummy: Record<string, MeanStd>;
  test: TestMetrics;
  global_importance: { feature: string; importance: number }[];
}
export interface MetricsResponse {
  targets: Record<Target, TargetMetrics>;
  meta: { n_rows: number; n_features: number; seed: number; tuned: boolean; sklearn: string };
}

export interface Presets {
  high_risk: Payload;
  low_risk: Payload;
}
