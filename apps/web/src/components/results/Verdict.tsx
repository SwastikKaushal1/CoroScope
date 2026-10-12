"use client";

import { ChevronRight } from "lucide-react";
import { ARTERIES } from "@/config/arteries";
import { riskWord } from "@/lib/reasons";
import { riskColorHex } from "@/lib/riskColor";
import type { PredictionResponse } from "@/lib/types";
import { useRiskStore } from "@/store/useRiskStore";

/** Text/background classes per risk band (readable on white, unlike the raw risk colour). */
export const BAND: Record<string, { text: string; soft: string }> = {
  Low: { text: "text-good", soft: "bg-good-soft" },
  Medium: { text: "text-warn", soft: "bg-warn-soft" },
  High: { text: "text-bad", soft: "bg-bad-soft" },
};

/** Low / Medium / High track with a marker at the probability. */
function Meter({ p }: { p: number }) {
  return (
    <div className="mt-6 max-w-md" aria-hidden>
      <div className="relative h-2.5 rounded-full" style={{ background: "linear-gradient(90deg,#1fa874 0%,#1fa874 30%,#eba327 33%,#eba327 63%,#d7263d 66%,#d7263d 100%)" }}>
        <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-surface bg-ink shadow" style={{ left: `${Math.min(98, Math.max(2, p * 100))}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-3 text-xs text-ink-3"><span>Low</span><span className="text-center">Medium</span><span className="text-right">High</span></div>
    </div>
  );
}

/** Step 1 of the results page: the answer in one sentence, a meter, then the three arteries. */
export default function Verdict({ result }: { result: PredictionResponse }) {
  const selected = useRiskStore((s) => s.selected);
  const hovered = useRiskStore((s) => s.hovered);
  const select = useRiskStore((s) => s.select);
  const hover = useRiskStore((s) => s.hover);
  const cad = result.predictions.CAD;
  const band = riskWord(cad.probability);
  const given = Object.keys(result.inputs ?? {}).length;
  const total = given + result.imputed_fields.length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow">Your result</p>
        <h1 className="font-display mt-3 text-4xl leading-[1.08] text-ink md:text-5xl">
          {cad.predicted_positive ? <>Signs point to <em className="text-bad">coronary artery disease</em></> : <>Coronary artery disease looks <em className="text-good">unlikely</em></>}
        </h1>
        <span className={`mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${BAND[band].soft} ${BAND[band].text}`}>
          <span className="size-2 rounded-full bg-current" /> {band} risk · {Math.round(cad.probability * 100)}%
        </span>
        <Meter p={cad.probability} />
        <p className="mt-6 max-w-md leading-7 text-ink-2">
          About <b className="text-ink">{Math.round(cad.probability * 100)} out of 100</b> people with answers like yours had narrowed heart arteries.{" "}
          {cad.predicted_positive
            ? "This is not a diagnosis. Please talk to a doctor, who may suggest a test such as an angiogram."
            : "Keep up healthy habits and regular check-ups."}
        </p>
        {given < total / 2 && (
          <p className="mt-4 max-w-md rounded-2xl bg-warn-soft px-4 py-3 text-sm leading-6 text-warn">
            Based on {given} of {total} details, so treat it as a rough guide. Test results from a doctor make it more precise.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink">Your three heart arteries</h2>
        <p className="text-xs text-ink-3">Tap one to see it on the heart and why.</p>
        <ul className="mt-3 flex flex-col gap-2">
          {ARTERIES.map((a) => {
            const p = result.predictions[a.id].probability;
            const w = riskWord(p);
            const active = selected === a.id;
            return (
              <li key={a.id}>
                <button type="button" aria-pressed={active} onClick={() => select(active ? null : a.id)}
                  onPointerEnter={() => hover(a.id)} onPointerLeave={() => hover(null)}
                  className={`flex w-full items-center gap-4 rounded-2xl border bg-surface px-4 py-3.5 text-left transition ${active ? "border-navy shadow-[0_0_0_3px_rgba(212,71,90,0.18)]" : hovered === a.id ? "border-line-strong" : "border-line hover:border-line-strong"}`}>
                  <span className="size-3 shrink-0 rounded-full" style={{ background: riskColorHex(p) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{a.supplies}</span>
                    <span className="block text-xs text-ink-3">{a.label} ({a.id})</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BAND[w].soft} ${BAND[w].text}`}>{w} · {Math.round(p * 100)}%</span>
                  <ChevronRight className={`size-4 shrink-0 text-ink-3 transition ${active ? "rotate-90" : ""}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
