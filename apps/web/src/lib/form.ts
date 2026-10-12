/**
 * Form state <-> model payload. The form keeps every value as a string ("" = unknown,
 * so the model imputes it); the payload uses the dataset's column names and encodings.
 */
import { ALL_FEATURES, CHEST_PAIN, type FeatureDef } from "@/config/features";
import type { Payload } from "./types";

export type FormValues = Record<string, string>;

export const emptyForm = (): FormValues => ({ name: "", [CHEST_PAIN.key]: "" });

/** A typed number outside the feature's plausible range (e.g. height typed in metres) is not used. */
export function inRange(def: FeatureDef, v: string): boolean {
  const n = parseFloat(v);
  return !isNaN(n) && (def.min === undefined || n >= def.min) && (def.max === undefined || n <= def.max);
}

export function calcBmi(weight?: string, height?: string): number | null {
  const w = parseFloat(weight ?? ""), h = parseFloat(height ?? "");
  if (!(w >= 30 && w <= 200 && h >= 120 && h <= 220)) return null; // same ranges as the Weight / Length fields
  return Math.round((w / (h / 100) ** 2) * 10) / 10;
}

export function toPayload(f: FormValues): Payload {
  const out: Payload = {};
  for (const def of ALL_FEATURES) {
    const v = (f[def.key] ?? "").trim();
    if (!v) continue;
    if (def.kind === "number") {
      if (inRange(def, v)) out[def.key] = +v;
    } else if (def.kind === "yesno") out[def.key] = v === "yes" ? 1 : 0;
    else if (def.kind === "sex") out[def.key] = v === "female" ? "Female" : "Male";
    else out[def.key] = isNaN(+v) ? v : +v; // select: category label or ordinal
  }
  const cp = f[CHEST_PAIN.key];
  if (cp) for (const [opt, col] of Object.entries(CHEST_PAIN.columns)) out[col] = cp === opt ? 1 : 0;
  const bmi = calcBmi(f.Weight, f.Length);
  if (bmi) {
    out.BMI = bmi;
    out.Obesity = bmi >= 25 ? 1 : 0; // the dataset's Obesity flag is exactly BMI >= 25
  }
  return out;
}

/** Dataset row (e.g. a /presets patient) -> form values. */
export function fromPayload(p: Payload, name = ""): FormValues {
  const f = emptyForm();
  f.name = name;
  const truthy = (v: unknown) => v === 1 || v === "1" || String(v).toUpperCase() === "Y";
  for (const def of ALL_FEATURES) {
    const v = p[def.key];
    if (v === undefined || v === null) continue;
    if (def.kind === "yesno") f[def.key] = truthy(v) ? "yes" : "no";
    else if (def.kind === "sex") f[def.key] = String(v).toLowerCase() === "male" || v === 1 ? "male" : "female";
    else if (def.kind === "number" && typeof v === "number") f[def.key] = String(Math.round(v * 10) / 10);
    else f[def.key] = String(v);
  }
  const cp = Object.entries(CHEST_PAIN.columns).find(([, col]) => truthy(p[col]));
  f[CHEST_PAIN.key] = cp ? cp[0] : "none";
  return f;
}

export const filledCount = (f: FormValues) =>
  ALL_FEATURES.filter((d) => (f[d.key] ?? "").trim() !== "").length + (f[CHEST_PAIN.key] ? 1 : 0);
export const TOTAL_FIELDS = ALL_FEATURES.length + 1;
