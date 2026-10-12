"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { ARTERIES } from "@/config/arteries";
import { plainReasons, strength } from "@/lib/reasons";
import type { PredictionResponse, Target } from "@/lib/types";
import { useRiskStore } from "@/store/useRiskStore";

const TABS: { id: Target; label: string }[] = [
  { id: "CAD", label: "Overall" },
  ...ARTERIES.map((a) => ({ id: a.id, label: a.supplies.replace(" of the heart", "") })),
];
/**
 * Step 2 of the results page: the top reasons as plain sentences (from SHAP), only for things
 * the user actually told us. Tabs follow the artery selected on the heart.
 */
export default function Reasons({ result }: { result: PredictionResponse }) {
  const selected = useRiskStore((s) => s.selected);
  const select = useRiskStore((s) => s.select);
  const target: Target = selected ?? "CAD";
  const reasons = plainReasons(result.predictions[target].explanation);

  return (
    <section aria-labelledby="why">
      <h2 id="why" className="font-display text-4xl text-ink">Why this result?</h2>
      <div role="tablist" aria-label="Explain" className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={target === t.id} onClick={() => select(t.id === "CAD" ? null : (t.id as typeof selected))}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${target === t.id ? "border-navy bg-navy text-white" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {reasons.length ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {reasons.map((r) => {
            const Icon = r.up ? ArrowUp : ArrowDown;
            return (
              <li key={r.key} className="card flex items-start gap-3 rounded-2xl p-5">
                <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${r.up ? "bg-bad-soft text-bad" : "bg-good-soft text-good"}`}>
                  <Icon className="size-4" />
                </span>
                <span className="text-[15px] leading-6 text-ink-2">
                  <b className="font-semibold text-ink">{r.label}</b>{" "}
                  <span className="text-ink-2">({r.value})</span>{" "}
                  {r.up ? "raised" : "lowered"} the risk {strength(r.share)}.
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-ink-2">None of your answers had a strong effect here. The result mostly reflects typical values.</p>
      )}
      <p className="mt-3 text-xs text-ink-3">Worked out with SHAP, a standard method for explaining machine-learning predictions.</p>
    </section>
  );
}
