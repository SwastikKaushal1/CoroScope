"use client";

import { ARTERIES } from "@/config/arteries";
import { MODEL_NAMES } from "@/lib/format";
import { riskColorHex } from "@/lib/riskColor";
import type { PredictionResponse } from "@/lib/types";
import { useRiskStore } from "@/store/useRiskStore";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Thin probability track. Width animates when the value changes. */
function Track({ p, className = "h-1" }: { p: number; className?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.round(p * 100)}%`, background: riskColorHex(p) }}
      />
    </div>
  );
}

/**
 * Left column. Two jobs: (1) state the overall verdict, (2) list the three vessels.
 * Every row is also a button: choosing one selects that vessel in 3D and switches the
 * explanation panel to it. "Overall CAD" = nothing selected.
 */
export default function Summary({ result }: { result: PredictionResponse }) {
  const selected = useRiskStore((s) => s.selected);
  const hovered = useRiskStore((s) => s.hovered);
  const select = useRiskStore((s) => s.select);
  const hover = useRiskStore((s) => s.hover);

  const cad = result.predictions.CAD;
  const cadColor = riskColorHex(cad.probability);

  return (
    <aside className="flex flex-col border-white/10 bg-slate-950/80 lg:min-h-0 lg:overflow-y-auto lg:border-r">
      <button
        aria-pressed={selected === null}
        onClick={() => select(null)}
        className="relative w-full px-5 pb-6 pt-5 text-left transition hover:bg-white/[0.03]"
      >
        {selected === null && (
          <span className="absolute inset-y-0 left-0 w-0.5" style={{ background: cadColor }} />
        )}
        <p className="text-sm text-slate-400">Overall result</p>
        <h2 className="font-display mt-1 text-[1.75rem] leading-tight">
          Coronary artery disease {cad.predicted_positive ? "likely" : "unlikely"}
        </h2>
        <div className="mt-4 flex items-baseline justify-between text-sm">
          <span className="tabular-nums" style={{ color: cadColor }}>
            {Math.round(cad.probability * 100)}% probability
          </span>
          <span className="text-slate-400">{cap(cad.risk_level)} risk</span>
        </div>
        <Track p={cad.probability} className="mt-2 h-2" />
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          CAD here means at least 50% narrowing in one or more major vessels. Model: {MODEL_NAMES[cad.model] ?? cad.model}.
        </p>
      </button>

      <div className="border-t border-white/10 px-5 pb-1 pt-4">
        <h3 className="text-sm text-slate-400">Coronary vessels</h3>
      </div>
      <ul>
        {ARTERIES.map((a) => {
          const p = result.predictions[a.id];
          const color = riskColorHex(p.probability);
          const active = selected === a.id;
          const lit = active || hovered === a.id;
          return (
            <li key={a.id}>
              <button
                aria-pressed={active}
                onClick={() => select(active ? null : a.id)}
                onPointerEnter={() => hover(a.id)}
                onPointerLeave={() => hover(null)}
                onFocus={() => hover(a.id)}
                onBlur={() => hover(null)}
                className={`relative w-full px-5 py-3.5 text-left transition ${lit ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
              >
                {active && <span className="absolute inset-y-0 left-0 w-0.5" style={{ background: color }} />}
                <div className="flex items-baseline justify-between">
                  <span>
                    <span className="font-medium">{a.id}</span>
                    <span className="ml-2 text-sm text-slate-400">{a.supplies}</span>
                  </span>
                  <span className="tabular-nums" style={{ color }}>
                    {Math.round(p.probability * 100)}%
                  </span>
                </div>
                <Track p={p.probability} className="mt-2 h-1" />
                <div className="mt-1.5 text-xs text-slate-500">
                  {cap(p.risk_level)} risk · {MODEL_NAMES[p.model] ?? p.model}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="px-5 py-4 text-xs leading-relaxed text-slate-500">
        Select a vessel here or on the heart to see what drove its score.
      </p>
    </aside>
  );
}
