"use client";

import { ARTERIES } from "@/config/arteries";
import { featureLabel, fmtValue, influenceWord } from "@/lib/format";
import type { PredictionResponse, Target } from "@/lib/types";
import { useRiskStore } from "@/store/useRiskStore";

const UP = "#ef4452"; // pushes risk up   (same red as the artery colour scale)
const DOWN = "#2fbf86"; // pulls risk down (same green)

/**
 * Right column: the "why". A diverging bar chart of the top contributing factors
 * for the selected target (SHAP-style). Right of the centre line = raised the score,
 * left = lowered it. Hatched bars = value was NOT entered, the model estimated it.
 */
export default function Explanation({ result }: { result: PredictionResponse }) {
  const selected = useRiskStore((s) => s.selected);
  const target: Target = selected ?? "CAD";
  const pred = result.predictions[target];
  const def = ARTERIES.find((a) => a.id === target);
  const name = def ? def.plain.toLowerCase() : "overall heart";
  const max = Math.max(1e-9, ...pred.explanation.map((e) => Math.abs(e.contribution)));

  // Everything the user actually typed in, de-duplicated across the four explanations.
  const entered = new Map<string, number>();
  Object.values(result.predictions).forEach((p) =>
    p.explanation.forEach((e) => e.value !== null && entered.set(e.feature, e.value))
  );

  return (
    <section className="border-white/10 bg-slate-950/80 px-5 py-5 lg:min-h-0 lg:overflow-y-auto lg:border-l">
      <h2 className="font-display text-xl leading-snug">
        What shaped your {name} result ({Math.round(pred.probability * 100)}%)
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
        These are the {pred.explanation.length} things that mattered most.
      </p>

      <div className="mt-5 flex items-center justify-between text-xs">
        <span style={{ color: DOWN }}>← Lowers risk</span>
        <span style={{ color: UP }}>Raises risk →</span>
      </div>
      <ol className="mt-1 divide-y divide-white/[0.06]" aria-label="Factors behind this prediction">
        {pred.explanation.map((e) => {
          const up = e.contribution >= 0;
          const color = up ? UP : DOWN;
          const estimated = e.value === null;
          const width = (Math.abs(e.contribution) / max) * 50; // % of the full track, from the centre
          return (
            <li
              key={e.feature}
              className="py-2.5"
              title={up ? "Raises risk" : "Lowers risk"}
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-slate-100">{featureLabel(e.feature)}</span>
                <span className={`shrink-0 tabular-nums ${estimated ? "italic text-slate-500" : "text-slate-300"}`}>
                  {fmtValue(e.feature, e.value)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="relative h-2 flex-1 rounded-full bg-white/[0.06]">
                  <span className="absolute -top-[3px] left-1/2 h-[14px] w-px bg-white/25" />
                  <span
                    className="absolute top-0 h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${width}%`,
                      left: up ? "50%" : undefined,
                      right: up ? undefined : "50%",
                      background: estimated
                        ? `repeating-linear-gradient(135deg, ${color} 0 3px, transparent 3px 6px)`
                        : color,
                      boxShadow: estimated ? `inset 0 0 0 1px ${color}` : undefined,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-slate-400">{influenceWord(e.share_pct)}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Longer bars mean a bigger effect. Striped bars are details we didn&rsquo;t have, so a typical value was used.
      </p>

      <h3 className="font-display mt-8 text-lg">Your details</h3>
      {entered.size ? (
        <dl className="mt-2 grid grid-cols-2 gap-x-6 text-sm">
          {[...entered].map(([f, v]) => (
            <div key={f} className="flex items-baseline justify-between gap-2 border-b border-white/[0.06] py-1.5">
              <dt className="truncate text-slate-400">{featureLabel(f)}</dt>
              <dd className="shrink-0 tabular-nums">{fmtValue(f, v)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No details were recorded for the main factors.</p>
      )}

      {result.imputed_fields.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          {result.imputed_fields.length} details weren&rsquo;t available, so typical values were used for them.
        </p>
      )}
    </section>
  );
}
