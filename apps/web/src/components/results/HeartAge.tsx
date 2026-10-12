"use client";

import { ArrowRight, HeartPulse } from "lucide-react";
import { fmtHeartAge, HEART_AGE_RANGE, heartAgeChanges, heartAgeFromInputs } from "@/lib/heartAge";
import type { PredictionResponse } from "@/lib/types";

/**
 * "Your heart age": the Framingham heart age next to the real age, plus the changes that
 * would bring it down. Shown under the verdict; hidden gracefully when age/sex are missing.
 */
export default function HeartAge({ result }: { result: PredictionResponse }) {
  const h = heartAgeFromInputs(result.inputs ?? {});

  if (!h) {
    return (
      <section className="card flex items-center gap-4 p-5">
        <HeartPulse className="size-6 shrink-0 text-heart" />
        <p className="text-sm text-ink-2">
          Add your age ({HEART_AGE_RANGE.min}–{HEART_AGE_RANGE.max}) and sex to see your <b className="text-ink">heart age</b>.
        </p>
      </section>
    );
  }

  const diff = Math.round(h.heartAge) - h.age;
  const older = diff >= 2, younger = diff <= -2;
  const tone = older ? "text-bad" : younger ? "text-good" : "text-ink";
  const changes = heartAgeChanges(h);

  return (
    <section className="card grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-7" aria-labelledby="heart-age">
      <div className="flex items-end gap-6">
        <div>
          <p id="heart-age" className="text-sm font-medium text-ink-2">Your heart age</p>
          <p className={`font-display text-6xl leading-none ${tone}`}>{fmtHeartAge(h.heartAge)}</p>
        </div>
        <div className="pb-1">
          <p className="text-sm text-ink-3">Your age</p>
          <p className="font-display text-3xl leading-none text-ink-2">{h.age}</p>
        </div>
      </div>

      <div>
        <p className="text-[15px] leading-6 text-ink">
          {older
            ? <>Your heart is ageing <b className="text-bad">{h.heartAge > 80 ? "much" : `${diff} years`} faster</b> than your real age, because of your risk factors.</>
            : younger
              ? <>Your heart is <b className="text-good">{-diff} years younger</b> than your real age. Keep it up.</>
              : <>Your heart age matches your real age.</>}
        </p>
        {changes.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {changes.map((c) => (
              <li key={c.label} className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
                <span>{c.label}</span>
                <ArrowRight className="size-3.5 text-ink-3" />
                <span className="font-semibold text-good">heart age {fmtHeartAge(c.heartAge)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs leading-5 text-ink-3">
          Heart age shows your <b className="font-semibold text-ink-2">long-term</b> risk from health habits (10-year chance of any heart or circulation problem).
          The result above is about arteries that may be narrowed <b className="font-semibold text-ink-2">now</b>, so the two can differ.
          Framingham formula (D&rsquo;Agostino 2008) using age, sex, blood pressure, weight, smoking and diabetes.
          {h.assumed.length > 0 && ` Typical values assumed for: ${h.assumed.join(", ")}.`}
        </p>
      </div>
    </section>
  );
}
