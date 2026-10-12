/** Display helpers: turn dataset column names and values into words a person can read. */
import { DERIVED, featureDef } from "@/config/features";
import type { FeatureValue } from "./types";

const CHEST_LABELS: Record<string, string> = {
  "Typical Chest Pain": "Typical chest pain",
  Atypical: "Atypical chest pain",
  Nonanginal: "Non-anginal chest pain",
  "Exertional CP": "Chest pain on exertion",
};

export const featureLabel = (f: string) => featureDef(f)?.label ?? CHEST_LABELS[f] ?? DERIVED[f] ?? f;

export function fmtValue(feature: string, v: FeatureValue | null): string {
  if (v === null || v === undefined) return "Estimated";
  const def = featureDef(feature);
  if (feature === "Sex") return v === 1 || v === "Male" ? "Male" : "Female";
  if (def?.kind === "select") return def.options?.find((o) => o.value === String(v))?.label ?? String(v);
  if (def?.kind === "yesno" || CHEST_LABELS[feature] || feature === "Obesity") return v === 1 || v === "Y" ? "Yes" : "No";
  if (typeof v === "number") {
    const n = Number.isInteger(v) ? String(v) : v.toFixed(1);
    return def?.unit ? `${n} ${def.unit}` : n;
  }
  return String(v);
}

/** Turns a factor's share of the explanation into a plain word instead of a percentage. */
export const influenceWord = (sharePct: number) => (sharePct >= 15 ? "Major" : sharePct >= 7 ? "Moderate" : "Minor");

export const MODEL_NAMES: Record<string, string> = {
  random_forest: "Random forest",
  xgboost: "XGBoost",
  logreg_l1: "L1 logistic regression",
};

export const pct = (p: number, digits = 0) => `${(p * 100).toFixed(digits)}%`;
