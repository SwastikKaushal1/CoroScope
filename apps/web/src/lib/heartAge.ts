/**
 * Heart age from the Framingham office-based (BMI) general CVD risk function:
 * D'Agostino RB Sr et al. "General cardiovascular risk profile for use in primary care."
 * Circulation 2008;117:743-753. Coefficients cross-checked against the CVrisk R package.
 *
 * 10-year risk = 1 - S0 ^ exp(L - mean), with
 * L = b_age*ln(age) + b_bmi*ln(BMI) + b_sbp*ln(SBP) + b_smoke*smoker + b_dm*diabetes.
 * Heart age = the age at which a person with NORMAL risk factors (SBP 125 untreated, BMI 22.5,
 * non-smoker, no diabetes) has the same risk. Valid for ages 30-74.
 *
 * This is separate from the ML models: those estimate narrowed arteries now; heart age expresses
 * long-term risk-factor burden in years, which is easier to grasp.
 */
import type { Payload } from "./types";

const COEF = {
  male: { age: 3.11296, bmi: 0.79277, sbpUntreated: 1.85508, sbpTreated: 1.92672, smoker: 0.70953, diabetes: 0.5316, mean: 23.9388, s0: 0.88431 },
  female: { age: 2.72107, bmi: 0.51125, sbpUntreated: 2.81291, sbpTreated: 2.88267, smoker: 0.61868, diabetes: 0.77763, mean: 26.0145, s0: 0.94833 },
};
const NORMAL = { sbp: 125, bmi: 22.5 };
export const HEART_AGE_RANGE = { min: 30, max: 74 };

export interface FraminghamInput {
  sex: "male" | "female";
  age: number;
  sbp: number;
  bmi: number;
  bpTreated: boolean;
  smoker: boolean;
  diabetes: boolean;
}

function linear(x: FraminghamInput) {
  const c = COEF[x.sex];
  return c.age * Math.log(x.age) + c.bmi * Math.log(x.bmi) + (x.bpTreated ? c.sbpTreated : c.sbpUntreated) * Math.log(x.sbp)
    + (x.smoker ? c.smoker : 0) + (x.diabetes ? c.diabetes : 0);
}

/** 10-year risk of any cardiovascular event, 0..1. */
export function framinghamRisk(x: FraminghamInput) {
  const c = COEF[x.sex];
  return 1 - Math.pow(c.s0, Math.exp(linear(x) - c.mean));
}

/** Age of a person with normal risk factors and the same 10-year risk. */
export function heartAgeOf(x: FraminghamInput) {
  const c = COEF[x.sex];
  const rest = c.bmi * Math.log(NORMAL.bmi) + c.sbpUntreated * Math.log(NORMAL.sbp);
  return Math.exp((linear(x) - rest) / c.age);
}

export interface HeartAge {
  age: number;
  heartAge: number;
  risk10y: number;
  /** Inputs we had to assume because the person didn't give them. */
  assumed: string[];
  input: FraminghamInput;
}

/**
 * Build the Framingham inputs from the model payload (dataset encodings) and compute heart age.
 * Returns null when age or sex is unknown, or age is outside the validated 30-74 range.
 * HTN = 1 is taken to mean the blood pressure is treated.
 */
export function heartAgeFromInputs(inputs: Payload): HeartAge | null {
  const age = typeof inputs.Age === "number" ? inputs.Age : NaN;
  if (!(age >= HEART_AGE_RANGE.min && age <= HEART_AGE_RANGE.max)) return null;
  if (inputs.Sex === undefined) return null;
  const sex = inputs.Sex === 1 || inputs.Sex === "Male" ? "male" : "female";
  const assumed: string[] = [];
  const htn = inputs.HTN === 1;
  let sbp = typeof inputs.BP === "number" ? inputs.BP : NaN;
  if (Number.isNaN(sbp)) { sbp = htn ? 140 : NORMAL.sbp; assumed.push("blood pressure"); }
  let bmi = typeof inputs.BMI === "number" ? inputs.BMI : NaN;
  if (Number.isNaN(bmi)) { bmi = 25; assumed.push("weight"); }
  if (inputs["Current Smoker"] === undefined) assumed.push("smoking");
  if (inputs.DM === undefined) assumed.push("diabetes");
  const input: FraminghamInput = { sex, age, sbp, bmi, bpTreated: htn, smoker: inputs["Current Smoker"] === 1, diabetes: inputs.DM === 1 };
  return { age, heartAge: heartAgeOf(input), risk10y: framinghamRisk(input), assumed, input };
}

/** Realistic changes and the heart age each would give (only the ones that apply). */
export function heartAgeChanges(h: HeartAge): { label: string; heartAge: number }[] {
  const out: { label: string; heartAge: number; input: FraminghamInput }[] = [];
  const x = h.input;
  if (x.smoker) out.push({ label: "Quit smoking", input: { ...x, smoker: false }, heartAge: 0 });
  if (x.sbp > 125 && !h.assumed.includes("blood pressure")) out.push({ label: `Bring blood pressure from ${Math.round(x.sbp)} to 120`, input: { ...x, sbp: 120 }, heartAge: 0 });
  if (x.bmi >= 25 && !h.assumed.includes("weight")) out.push({ label: "Reach a healthy weight (BMI under 25)", input: { ...x, bmi: 24.5 }, heartAge: 0 });
  if (out.length > 1) out.push({ label: "All of these together", input: { ...x, smoker: false, sbp: Math.min(x.sbp, 120), bmi: Math.min(x.bmi, 24.5) }, heartAge: 0 });
  // Keep only changes that move the displayed number (e.g. not "80+" -> "80+").
  return out.map((o) => ({ label: o.label, heartAge: heartAgeOf(o.input) }))
    .filter((o) => o.heartAge < h.heartAge - 0.5 && fmtHeartAge(o.heartAge) !== fmtHeartAge(h.heartAge));
}

/** Heart age as people say it: whole years, capped at "80+" like the published Framingham tables. */
export const fmtHeartAge = (a: number) => (a > 80 ? "80+" : a < 30 ? "under 30" : String(Math.round(a)));
