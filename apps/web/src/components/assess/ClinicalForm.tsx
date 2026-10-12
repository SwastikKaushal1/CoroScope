"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Database, RotateCcw } from "lucide-react";
import { CHEST_PAIN, FEATURE_GROUPS } from "@/config/features";
import { calcBmi, filledCount, toPayload, TOTAL_FIELDS, type FormValues } from "@/lib/form";
import { fmtValue } from "@/lib/format";
import { Field, fieldLabel, inputBox } from "./Fields";

const STEPS = [...FEATURE_GROUPS.map((g) => g.title), "Review"];
export const REVIEW_STEP = STEPS.length - 1;

/** Full clinical form: every model input, grouped into steps, for users with ECG / lab / echo reports. */
export default function ClinicalForm({ form, set, onClear, medians, onSubmit, onQuick, onPreset, presetError, error, startStep = 0 }: {
  form: FormValues;
  set: (k: string) => (v: string) => void;
  onClear: () => void;
  medians: Record<string, number>;
  onSubmit: () => void;
  onQuick: () => void;
  onPreset: (kind: "high_risk" | "low_risk") => Promise<boolean>;
  presetError: string;
  error: React.ReactNode;
  startStep?: number;
}) {
  const [step, setStep] = useState(startStep);
  const filled = filledCount(form);
  const bmi = calcBmi(form.Weight, form.Length);
  const group = FEATURE_GROUPS[step];
  const isReview = step === REVIEW_STEP;
  const preset = async (kind: "high_risk" | "low_risk") => { if (await onPreset(kind)) setStep(REVIEW_STEP); };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-5 lg:grid-cols-[240px_1fr] lg:py-12">
      {/* Step rail */}
      <aside className="flex flex-col gap-5">
        <button type="button" onClick={onQuick} className="flex items-center gap-2 px-1 text-xs text-ink-2 hover:text-ink">
          <ArrowLeft className="size-3.5" /> Back to the quick check
        </button>
        <ol className="flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Assessment steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
                className={`flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm transition ${i === step ? "bg-navy/10 text-heart" : "text-ink-2 hover:bg-sunken hover:text-ink"}`}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[11px] ${i < step ? "border-teal-400/50 bg-navy/20 text-heart" : i === step ? "border-navy text-heart" : "border-line-strong"}`}>
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-ink-2"><span className="font-mono text-lg text-ink">{filled}</span> / {TOTAL_FIELDS} details provided</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-navy transition-[width]" style={{ width: `${(filled / TOTAL_FIELDS) * 100}%` }} /></div>
          <p className="mt-2 text-xs leading-5 text-ink-3">Everything is optional. Missing values use the cohort median, and the results flag them as estimated.</p>
        </div>
        <div className="rounded-2xl border border-teal-400/15 bg-navy/[.04] p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-heart"><Database className="size-3.5" /> Try a real patient</p>
          <p className="mt-1 text-xs leading-5 text-ink-2">Fill every field from a dataset record.</p>
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" onClick={() => preset("high_risk")} className="rounded-lg border border-bad/30 bg-bad-soft px-3 py-2 text-left text-xs text-bad hover:bg-bad-soft">High-risk patient (angiography: CAD)</button>
            <button type="button" onClick={() => preset("low_risk")} className="rounded-lg border border-good/30 bg-good-soft px-3 py-2 text-left text-xs text-good hover:bg-good-soft">Low-risk patient (angiography: normal)</button>
            <button type="button" onClick={() => { onClear(); setStep(0); }} className="flex items-center gap-1.5 px-1 text-xs text-ink-3 hover:text-ink"><RotateCcw className="size-3" /> Clear form</button>
          </div>
          {presetError && <p className="mt-2 text-xs text-bad">{presetError}</p>}
        </div>
      </aside>

      {/* Step body */}
      <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-2xl shadow-navy/5 md:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-heart">Clinical form · step {step + 1} / {STEPS.length}</p>
        <h1 className="font-display mt-2 text-4xl text-ink md:text-5xl">{STEPS[step]}</h1>
        <p className="mt-2 text-sm text-ink-2">{isReview ? "Check the values below, then run the four models." : group.blurb}</p>
        <div className="my-6 border-t border-line" />

        {!isReview ? (
          <div key={step} className="fade-up flex flex-col gap-7">
            {group.id === "profile" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="f-name" className={fieldLabel}>Patient name or reference <span className="normal-case tracking-normal text-ink-3">(report only, never sent to the model)</span></label>
                <input id="f-name" value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Patient 014" className={inputBox} />
              </div>
            )}
            {group.id === "symptoms" && (
              <div className="flex flex-col gap-2">
                <span className={fieldLabel}>{CHEST_PAIN.label}</span>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={CHEST_PAIN.label}>
                  {CHEST_PAIN.options.map((o) => (
                    <button key={o.value} type="button" role="radio" aria-checked={form[CHEST_PAIN.key] === o.value} onClick={() => set(CHEST_PAIN.key)(form[CHEST_PAIN.key] === o.value ? "" : o.value)}
                      className={`rounded-xl border p-3 text-left transition ${form[CHEST_PAIN.key] === o.value ? "border-teal-300 bg-navy/10" : "border-line bg-surface hover:border-line-strong"}`}>
                      <span className="text-sm font-medium text-ink">{o.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-ink-2">{o.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
              {group.features.map((d) => <Field key={d.key} def={d} value={form[d.key] ?? ""} onChange={set(d.key)} median={medians[d.key]} />)}
            </div>
            {group.id === "profile" && (
              <p className="rounded-xl border border-line bg-paper px-4 py-3 font-mono text-sm text-ink-2">
                BMI (calculated): <span className="text-ink">{bmi ? `${bmi} kg/m²` : "—"}</span>
                {bmi && <span className="ml-2 text-xs text-ink-3">{bmi >= 25 ? "· counted as obesity in the dataset" : ""}</span>}
              </p>
            )}
          </div>
        ) : (
          <div className="fade-up flex flex-col gap-6">
            {FEATURE_GROUPS.map((g, gi) => {
              const rows = g.features.filter((d) => form[d.key]);
              const cp = g.id === "symptoms" && form[CHEST_PAIN.key];
              return (
                <div key={g.id}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h2 className="text-sm font-medium text-ink">{g.title}</h2>
                    <button type="button" onClick={() => setStep(gi)} className="text-xs text-heart hover:text-heart">Edit</button>
                  </div>
                  {rows.length || cp ? (
                    <dl className="grid gap-x-6 sm:grid-cols-2">
                      {cp && <div className="flex justify-between gap-3 border-b border-line py-1.5 text-sm"><dt className="text-ink-2">Chest pain</dt><dd className="font-mono text-ink">{CHEST_PAIN.options.find((o) => o.value === form[CHEST_PAIN.key])?.label}</dd></div>}
                      {rows.map((d) => {
                        const payload = toPayload({ [d.key]: form[d.key] });
                        return <div key={d.key} className="flex justify-between gap-3 border-b border-line py-1.5 text-sm"><dt className="truncate text-ink-2">{d.label}</dt><dd className="shrink-0 font-mono text-ink">{fmtValue(d.key, payload[d.key] ?? null)}</dd></div>;
                      })}
                    </dl>
                  ) : <p className="text-xs text-ink-3">Nothing entered: cohort medians will be used.</p>}
                </div>
              );
            })}
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          <button type="button" onClick={() => (step === 0 ? onQuick() : setStep(step - 1))} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-sunken hover:text-ink">
            <ArrowLeft className="size-4" />{step === 0 ? "Quick check" : "Back"}
          </button>
          {isReview ? (
            <button type="button" onClick={onSubmit} disabled={!filled} className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-2 disabled:opacity-40">
              Run prediction <ArrowRight className="size-4" />
            </button>
          ) : (
            <button type="button" onClick={() => setStep(step + 1)} className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-2">
              Continue <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
