"use client";

import { useState } from "react";
import { ARTERIES } from "@/config/arteries";
import { featureDef } from "@/config/features";
import { featureLabel, fmtValue, influenceWord, MODEL_NAMES, pct } from "@/lib/format";
import type { PredictionResponse, Target } from "@/lib/types";
import { useRiskStore } from "@/store/useRiskStore";

const UP = "#ef4452"; // pushes risk up   (same red as the artery colour scale)
const DOWN = "#2fbf86"; // pulls risk down (same green)
const TOP_N = 10;

/**
 * "For doctors" panel: a diverging SHAP bar chart of the top factors for the selected
 * target (right of centre = raised the score, left = lowered it), then every measurement the
 * user entered with its signed contribution. Hatched bars = value NOT entered (imputed).
 */
export default function Explanation({ result }: { result: PredictionResponse }) {
  const selected = useRiskStore((s) => s.selected);
  const [technical, setTechnical] = useState(false);
  const target: Target = selected ?? "CAD";
  const pred = result.predictions[target];
  const def = ARTERIES.find((a) => a.id === target);
  const name = def ? def.id : "overall CAD";
  const top = pred.explanation.slice(0, TOP_N);
  const max = Math.max(1e-9, ...top.map((e) => Math.abs(e.contribution)));
  const label = (f: string) => (technical ? featureDef(f)?.clinical ?? f : featureLabel(f));

  // Signed share of this target's explanation for every entered measurement.
  const byFeature = new Map(pred.explanation.map((e) => [e.feature, e]));
  const measurements = Object.entries(result.inputs ?? {})
    .map(([f, v]) => ({ f, v, e: byFeature.get(f) }))
    .sort((a, b) => (b.e?.share_pct ?? 0) - (a.e?.share_pct ?? 0));
  const maxShare = Math.max(1, ...measurements.map((m) => m.e?.share_pct ?? 0));

  return (
    <section className="grid gap-x-10 lg:grid-cols-2">
      <div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl leading-snug">
          What drove the {name} result ({pct(pred.probability)})
        </h2>
        <div role="group" aria-label="Explanation detail" className="flex shrink-0 rounded-lg border border-line p-0.5 text-[11px]">
          {(["Plain", "Technical"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={technical === (m === "Technical")} onClick={() => setTechnical(m === "Technical")}
              className={`rounded-md px-2 py-1 transition ${technical === (m === "Technical") ? "bg-sunken text-ink" : "text-ink-2 hover:text-ink"}`}>{m}</button>
          ))}
        </div>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
        {technical
          ? <>SHAP values from the {MODEL_NAMES[pred.model] ?? pred.model} ({pred.model === "random_forest" ? "probability" : "log-odds"} units). Decision threshold {pct(pred.threshold)} (Youden&rsquo;s J on out-of-fold predictions).</>
          : <>The {top.length} factors that moved this prediction the most, measured with SHAP.</>}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs">
        <span style={{ color: DOWN }}>← Lowers risk</span>
        <span style={{ color: UP }}>Raises risk →</span>
      </div>
      <ol className="mt-1 divide-y divide-line" aria-label="Factors behind this prediction">
        {top.map((e) => {
          const up = e.contribution >= 0;
          const color = up ? UP : DOWN;
          const estimated = e.value === null;
          const width = (Math.abs(e.contribution) / max) * 50; // % of the full track, from the centre
          return (
            <li key={e.feature} className="py-2.5" title={up ? "Raises risk" : "Lowers risk"}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={`truncate text-ink ${technical ? "font-mono text-xs" : ""}`}>{label(e.feature)}</span>
                <span className={`shrink-0 tabular-nums ${estimated ? "italic text-ink-3" : "text-ink-2"}`}>
                  {fmtValue(e.feature, e.value)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="relative h-2 flex-1 rounded-full bg-sunken">
                  <span className="absolute -top-[3px] left-1/2 h-[14px] w-px bg-line-strong" />
                  <span
                    className="absolute top-0 h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${width}%`,
                      left: up ? "50%" : undefined,
                      right: up ? undefined : "50%",
                      background: estimated ? `repeating-linear-gradient(135deg, ${color} 0 3px, transparent 3px 6px)` : color,
                      boxShadow: estimated ? `inset 0 0 0 1px ${color}` : undefined,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-ink-2">
                  {technical ? `${up ? "+" : ""}${e.contribution.toFixed(3)}` : influenceWord(e.share_pct)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs leading-relaxed text-ink-3">
        Longer bars mean a bigger effect. Striped bars are values that weren&rsquo;t entered, so the cohort median was used.
      </p>

      </div>
      <div>
      <h3 className="font-display mt-8 text-lg lg:mt-0">Physiological measurements</h3>
      <p className="mt-1 text-xs text-ink-3">Everything entered, with its share of the {name} explanation.</p>
      {measurements.length ? (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-ink-3">
              <th className="pb-2 font-medium">Measurement</th>
              <th className="pb-2 text-right font-medium">Value</th>
              <th className="w-24 pb-2 pl-3 text-right font-medium">Effect</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map(({ f, v, e }) => {
              const normal = featureDef(f)?.normal;
              const up = (e?.contribution ?? 0) >= 0;
              return (
                <tr key={f} className="border-t border-line">
                  <td className="py-1.5 pr-2">
                    <span className={`block truncate text-ink-2 ${technical ? "font-mono text-xs" : ""}`}>{label(f)}</span>
                    {normal && <span className="text-[11px] text-ink-3">normal {normal}</span>}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-ink">{fmtValue(f, v)}</td>
                  <td className="py-1.5 pl-3">
                    {e ? (
                      <div className="flex items-center justify-end gap-2" title={`${e.share_pct}% of the explanation, ${e.direction}`}>
                        <span className="h-1.5 rounded-full" style={{ width: `${Math.max(2, (e.share_pct / maxShare) * 48)}px`, background: up ? UP : DOWN }} />
                        <span className="w-9 text-right font-mono text-[11px] text-ink-2">{up ? "+" : "−"}{e.share_pct.toFixed(0)}%</span>
                      </div>
                    ) : <span className="block text-right text-xs text-ink-3">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="mt-2 text-sm text-ink-3">No measurements were entered.</p>
      )}

      {result.imputed_fields.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          {result.imputed_fields.length} of {result.imputed_fields.length + Object.keys(result.inputs ?? {}).length} model inputs weren&rsquo;t provided and used the training-set median.
        </p>
      )}
      </div>
    </section>
  );
}
