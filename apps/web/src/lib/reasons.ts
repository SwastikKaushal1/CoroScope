/** Plain-language reasons built from SHAP explanations (shared by results, landing and report). */
import { CHEST_PAIN } from "@/config/features";
import { featureLabel, fmtValue } from "./format";
import type { Contribution } from "./types";

export type Reason = { key: string; label: string; value: string; up: boolean; share: number };

const CHEST_COLS = new Set(Object.values(CHEST_PAIN.columns));

export const strength = (share: number) => (share >= 15 ? "a lot" : share >= 7 ? "somewhat" : "a little");

/** Entered values only, with the three chest-pain columns merged into one answer, strongest first. */
export function plainReasons(expl: Contribution[], max = 5): Reason[] {
  const out: Reason[] = [];
  const chest = expl.filter((e) => CHEST_COLS.has(e.feature) && e.value !== null);
  if (chest.length) {
    const signed = chest.reduce((t, e) => t + (e.contribution >= 0 ? 1 : -1) * e.share_pct, 0);
    const col = Object.entries(CHEST_PAIN.columns).find(([, c]) => chest.some((e) => e.feature === c && e.value === 1))?.[0] ?? "none";
    const label = CHEST_PAIN.options.find((o) => o.value === col)?.plain ?? "No chest pain";
    out.push({ key: "chest", label: "Your chest pain", value: label, up: signed >= 0, share: Math.abs(signed) });
  }
  for (const e of expl) {
    if (e.value === null || CHEST_COLS.has(e.feature)) continue;
    out.push({ key: e.feature, label: featureLabel(e.feature), value: fmtValue(e.feature, e.value), up: e.contribution >= 0, share: e.share_pct });
  }
  return out.filter((r) => r.share >= 2).sort((a, b) => b.share - a.share).slice(0, max);
}

/** Risk band word used everywhere in the UI. */
export const riskWord = (p: number) => (p < 0.33 ? "Low" : p < 0.66 ? "Medium" : "High");
