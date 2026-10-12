"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClinicalForm, { REVIEW_STEP } from "@/components/assess/ClinicalForm";
import QuickCheck from "@/components/assess/QuickCheck";
import Loader from "@/components/site/Loader";
import SiteHeader from "@/components/site/SiteHeader";
import { RESULTS_ROUTE } from "@/config/routes";
import { API_URL, getPresets, predict } from "@/lib/api";
import { emptyForm, fromPayload, toPayload, type FormValues } from "@/lib/form";
import { MOCK_RESULT } from "@/lib/mockResult";
import type { PredictionResponse } from "@/lib/types";
import { useRiskStore } from "@/store/useRiskStore";

/**
 * /assess: the quick check (default, everyday questions) or the full clinical form.
 * Both edit the same form state, so switching modes never loses answers.
 */
export default function AssessPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"quick" | "clinical">("quick");
  const [clinicalStart, setClinicalStart] = useState(0);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [medians, setMedians] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [presetError, setPresetError] = useState("");
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setMany = (v: FormValues) => setForm((f) => ({ ...f, ...v }));

  useEffect(() => {
    fetch(`${API_URL}/schema`).then((r) => r.json()).then((s: { columns: { name: string; median?: number }[] }) =>
      setMedians(Object.fromEntries(s.columns.filter((c) => c.median !== undefined).map((c) => [c.name, c.median!])))
    ).catch(() => {});
  }, []);

  const loadPreset = async (kind: "high_risk" | "low_risk") => {
    setPresetError("");
    try {
      const p = await getPresets();
      setForm(fromPayload(p[kind], kind === "high_risk" ? "Dataset patient A (CAD+)" : "Dataset patient B (normal)"));
      return true;
    } catch {
      setPresetError("Couldn't reach the API to load dataset patients.");
      return false;
    }
  };

  const finish = (data: PredictionResponse) => {
    const sex = form.Sex === "female" ? "Female" : form.Sex === "male" ? "Male" : "";
    useRiskStore.getState().setResult({ ...data, patient: { ...data.patient, name: form.name, age: form.Age ?? "", sex } });
    router.push(RESULTS_ROUTE);
  };

  const submit = async () => {
    setBusy(true); setError("");
    try {
      finish(await predict(toPayload(form)));
    } catch (e) {
      setError(`${(e as Error).message}. Is the prediction server running?`);
      setBusy(false);
    }
  };

  const errorBox = error && (
    <div role="alert" className="rounded-xl border border-bad/30 bg-bad-soft p-4 text-sm text-bad">
      {error}
      <button type="button" onClick={() => finish(MOCK_RESULT)} className="ml-2 underline">View the offline demo instead</button>
    </div>
  );

  if (busy) return <main className="min-h-dvh bg-paper"><SiteHeader cta={false} /><Loader /></main>;

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <SiteHeader cta={false} />
      {mode === "quick" ? (
        <QuickCheck form={form} set={set} setMany={setMany} onSubmit={submit}
          error={errorBox || (presetError && <p role="alert" className="text-sm text-bad">{presetError}</p>)}
          onClinical={() => { setClinicalStart(0); setMode("clinical"); window.scrollTo(0, 0); }}
          onPreset={async () => { if (await loadPreset("high_risk")) { setClinicalStart(REVIEW_STEP); setMode("clinical"); window.scrollTo(0, 0); } }} />
      ) : (
        <ClinicalForm key={clinicalStart} startStep={clinicalStart} form={form} set={set} onClear={() => setForm(emptyForm())} medians={medians}
          onSubmit={submit} onQuick={() => setMode("quick")} onPreset={loadPreset} presetError={presetError} error={errorBox} />
      )}
    </main>
  );
}
