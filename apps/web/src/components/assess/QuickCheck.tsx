"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, ClipboardList, Database } from "lucide-react";
import { CHEST_PAIN, featureDef, QUICK_CORE_YES_NO, QUICK_MORE_YES_NO, SMOKING } from "@/config/features";
import type { FormValues } from "@/lib/form";
import { inputBox, NumberInput, Segmented, YES_NO_UNKNOWN } from "./Fields";

/** The six questions shown up front. Everything else is optional or imputed. */
const CORE_KEYS = ["Age", "Sex", ...QUICK_CORE_YES_NO.map((q) => q.key), "Current Smoker", CHEST_PAIN.key];
export const coreAnswered = (f: FormValues) => CORE_KEYS.filter((k) => (f[k] ?? "") !== "").length;
export const CORE_TOTAL = CORE_KEYS.length;

function Ask({ q, hint, children, htmlFor }: { q: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm text-ink">{q}</label>
      {hint && <p className="-mt-1 text-xs text-ink-3">{hint}</p>}
      {children}
    </div>
  );
}

/**
 * The default assessment: six everyday questions, about 30 seconds. An optional "more details"
 * section adds a few more; ECG / labs / echo live in the clinical form. Anything not answered
 * is imputed with the training median, and the results page says so.
 */
export default function QuickCheck({ form, set, setMany, onSubmit, onClinical, onPreset, error }: {
  form: FormValues;
  set: (k: string) => (v: string) => void;
  setMany: (v: FormValues) => void;
  onSubmit: () => void;
  onClinical: () => void;
  onPreset: () => void;
  error: React.ReactNode;
}) {
  const [more, setMore] = useState(false);
  const smoking = SMOKING.options.find((o) => Object.entries(o.set).every(([k, v]) => form[k] === v))?.value ?? "";
  const answered = coreAnswered(form);
  const num = (key: string, q: string, example: string) => (
    <Ask q={q} htmlFor={`q-${key}`}>
      <NumberInput id={`q-${key}`} def={featureDef(key)!} value={form[key] ?? ""} onChange={set(key)} placeholder={`e.g. ${example}`} />
    </Ask>
  );
  const yesNo = (q: { key: string; question: string; hint?: string }) => (
    <Ask key={q.key} q={q.question} hint={q.hint}>
      <Segmented size="lg" label={q.question} value={form[q.key] ?? ""} onChange={set(q.key)} options={YES_NO_UNKNOWN} />
    </Ask>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8 sm:px-5 lg:py-12">
      <div>
        <p className="eyebrow">Quick heart check · about 30 seconds</p>
        <h1 className="font-display mt-3 text-5xl leading-tight text-ink md:text-6xl">Six quick questions.</h1>
        <p className="mt-3 text-ink-2">No medical reports needed. Tap <b className="font-medium text-ink">Not sure</b> for anything you don&rsquo;t know.</p>
      </div>

      <section className="flex flex-col gap-6 rounded-3xl border border-line bg-surface p-5 md:p-7">
        <Ask q="Your name (optional, only shown on your report)" htmlFor="q-name">
          <input id="q-name" value={form.name ?? ""} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Rahul" className={inputBox} />
        </Ask>
        <div className="grid gap-5 sm:grid-cols-2">
          {num("Age", "1. How old are you?", "55")}
          <Ask q="2. Sex">
            <Segmented size="lg" label="Sex" value={form.Sex ?? ""} onChange={set("Sex")} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          </Ask>
        </div>
        {QUICK_CORE_YES_NO.map((q, i) => yesNo({ ...q, question: `${i + 3}. ${q.question}` }))}
        <Ask q={`5. ${SMOKING.question}`}>
          <Segmented size="lg" label={SMOKING.question} value={smoking}
            onChange={(v) => setMany(SMOKING.options.find((o) => o.value === v)?.set ?? { "Current Smoker": "", "EX-Smoker": "" })}
            options={[...SMOKING.options, { value: "", label: "Not sure" }]} />
        </Ask>
        <Ask q="6. Do you get chest pain or pressure?">
          <div className="grid gap-2" role="radiogroup" aria-label="Chest pain">
            {CHEST_PAIN.options.map((o) => (
              <button key={o.value} type="button" role="radio" aria-checked={form[CHEST_PAIN.key] === o.value}
                onClick={() => set(CHEST_PAIN.key)(form[CHEST_PAIN.key] === o.value ? "" : o.value)}
                className={`rounded-xl border px-4 py-3 text-left transition ${form[CHEST_PAIN.key] === o.value ? "border-teal-300 bg-navy/10" : "border-line bg-surface hover:border-line-strong"}`}>
                <span className="text-sm text-ink">{o.plain}</span>
                {o.plainHint && <span className="mt-0.5 block text-xs text-ink-3">{o.plainHint}</span>}
              </button>
            ))}
          </div>
        </Ask>
      </section>

      {/* Optional extras, closed by default */}
      <section className="rounded-3xl border border-line bg-surface">
        <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="flex w-full items-center justify-between gap-3 p-5 text-left md:px-7">
          <span>
            <span className="block text-sm font-medium text-ink">Add more details (optional)</span>
            <span className="mt-0.5 block text-xs text-ink-3">Height, weight, cholesterol, family history, blood pressure… makes the result more precise.</span>
          </span>
          <ChevronDown className={`size-5 shrink-0 text-ink-2 transition ${more ? "rotate-180" : ""}`} />
        </button>
        {more && (
          <div className="flex flex-col gap-5 border-t border-line p-5 md:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              {num("Length", "Height", "170")}
              {num("Weight", "Weight", "72")}
              {num("BP", "Blood pressure, top number", "120")}
              {num("PR", "Resting pulse", "72")}
            </div>
            {QUICK_MORE_YES_NO.map(yesNo)}
          </div>
        )}
      </section>

      {error}

      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-4 rounded-2xl border border-line-strong bg-surface/95 p-3 pl-5 shadow-2xl backdrop-blur">
        <span className="text-xs text-ink-2"><span className="font-mono text-sm text-ink">{answered}</span> / {CORE_TOTAL} answered</span>
        <button type="button" onClick={onSubmit} disabled={!answered}
          className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-2 disabled:opacity-40">
          See my results <ArrowRight className="size-4" />
        </button>
      </div>

      <button type="button" onClick={onClinical} className="flex items-start gap-4 rounded-2xl border border-line p-5 text-left transition hover:border-teal-400/40 hover:bg-navy/[.03]">
        <ClipboardList className="mt-0.5 size-5 shrink-0 text-heart" />
        <span>
          <span className="block text-sm font-medium text-ink">Have ECG, blood test or echo reports? Use the clinical form.</span>
          <span className="mt-1 block text-xs leading-5 text-ink-2">For doctors: all 55 inputs, including the strongest predictors. Your answers above are kept.</span>
        </span>
      </button>
      <button type="button" onClick={onPreset} className="flex items-center justify-center gap-2 text-xs text-ink-3 hover:text-ink">
        <Database className="size-3.5" /> Or try a real patient from the dataset
      </button>
    </div>
  );
}
