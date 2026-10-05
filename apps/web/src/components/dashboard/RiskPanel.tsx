"use client";

import { ARTERIES } from "@/config/arteries";
import { riskColorHex, riskLevel } from "@/lib/riskColor";
import { useRiskStore } from "@/store/useRiskStore";

/**
 * Right-hand dashboard. It reads and writes the SAME Zustand store as the 3D
 * scene, which is why dragging a slider recolours the artery instantly and why
 * hovering a row highlights the matching vessel in 3D (and vice versa).
 */
export default function RiskPanel() {
  const probabilities = useRiskStore((s) => s.probabilities);
  const selected = useRiskStore((s) => s.selected);
  const hovered = useRiskStore((s) => s.hovered);
  const setProbability = useRiskStore((s) => s.setProbability);
  const setAll = useRiskStore((s) => s.setAll);
  const select = useRiskStore((s) => s.select);
  const hover = useRiskStore((s) => s.hover);

  const selectedDef = ARTERIES.find((a) => a.id === selected);

  return (
    <aside className="space-y-6 overflow-y-auto border-t border-white/10 bg-slate-950/80 p-5 lg:border-l lg:border-t-0">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">CardioMap 3D</h1>
        <p className="text-sm text-slate-400">Set vessel risk manually to preview the 3D colour mapping.</p>
      </header>

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
          onClick={() => setAll({ LAD: 0.82, LCX: 0.38, RCA: 0.66 })}
        >
          High-risk demo
        </button>
        <button
          className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
          onClick={() => setAll({ LAD: 0.09, LCX: 0.07, RCA: 0.11 })}
        >
          Low-risk demo
        </button>
      </div>

      <div className="space-y-3">
        {ARTERIES.map((a) => {
          const p = probabilities[a.id];
          const active = selected === a.id || hovered === a.id;
          return (
            <div
              key={a.id}
              onPointerEnter={() => hover(a.id)}
              onPointerLeave={() => hover(null)}
              className={`rounded-lg border p-3 transition ${
                active ? "border-white/30 bg-white/10" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <button className="font-medium" onClick={() => select(selected === a.id ? null : a.id)}>
                  {a.id}
                </button>
                <span className="flex items-center gap-2 tabular-nums">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: riskColorHex(p), boxShadow: `0 0 8px ${riskColorHex(p)}` }}
                  />
                  {Math.round(p * 100)}% · {riskLevel(p)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(p * 100)}
                onChange={(e) => setProbability(a.id, Number(e.target.value) / 100)}
                className="w-full"
                aria-label={`${a.id} probability`}
              />
            </div>
          );
        })}
      </div>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
        {selectedDef ? (
          <>
            <div className="font-medium">
              {selectedDef.id}: {selectedDef.label}
            </div>
            <div className="text-slate-400">Supplies: {selectedDef.supplies}</div>
            <div className="mt-2">
              Predicted risk: {Math.round(probabilities[selectedDef.id] * 100)}% ·{" "}
              {riskLevel(probabilities[selectedDef.id])}
            </div>
            <button className="mt-3 text-xs text-slate-400 underline" onClick={() => select(null)}>
              Clear selection
            </button>
          </>
        ) : (
          <span className="text-slate-400">Click an artery or its label in the 3D view to inspect it.</span>
        )}
      </section>
    </aside>
  );
}
