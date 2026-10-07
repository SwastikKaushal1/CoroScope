"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Disclaimer from "@/components/web/Disclaimer";
import Footer from "@/components/web/Footer";
import Loader from "@/components/web/Loader";
import { RESULTS_ROUTE } from "@/config/routes";
import { MOCK_RESULT } from "@/lib/mockResult";
import { useRiskStore } from "@/store/useRiskStore";

type F = { k: string; label: string; unit?: string; type?: "yesno" | "sex" };
// Keys must match your backend feature names. All optional: blanks are imputed.
const STEPS: { title: string; fields: F[] }[] = [
  { title: "Demographics", fields: [
    { k: "Age", label: "Age", unit: "years" }, { k: "Sex", label: "Sex", type: "sex" },
    { k: "Weight", label: "Weight", unit: "kg" }, { k: "Length", label: "Height", unit: "cm" },
    { k: "DM", label: "Diabetes", type: "yesno" }, { k: "HTN", label: "Hypertension", type: "yesno" },
    { k: "Current Smoker", label: "Current smoker", type: "yesno" }, { k: "FH", label: "Family history of CAD", type: "yesno" } ] },
  { title: "Vitals & ECG", fields: [
    { k: "BP", label: "Systolic BP", unit: "mmHg" }, { k: "PR", label: "Pulse rate", unit: "bpm" },
    { k: "Typical Chest Pain", label: "Typical chest pain", type: "yesno" }, { k: "ST Elevation", label: "ST elevation", type: "yesno" },
    { k: "T inversion", label: "T inversion", type: "yesno" }, { k: "LVH", label: "LVH", type: "yesno" } ] },
  { title: "Labs & Echo", fields: [
    { k: "FBS", label: "Fasting blood sugar", unit: "mg/dL" }, { k: "LDL", label: "LDL", unit: "mg/dL" },
    { k: "HDL", label: "HDL", unit: "mg/dL" }, { k: "TG", label: "Triglycerides", unit: "mg/dL" },
    { k: "EF-TTE", label: "Ejection fraction", unit: "%" }, { k: "Region RWMA", label: "RWMA region (0-4)" } ] },
];
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const inp = "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-teal-400";
const btn = "rounded-full bg-teal-400 px-6 py-2 font-medium text-slate-950 hover:bg-teal-300";

export default function Assess() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const body = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== "").map(([k, x]) => [k, isNaN(+x) ? x : +x]));
      const res = await fetch(`${API}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      useRiskStore.getState().setResult(await res.json());
      router.push(RESULTS_ROUTE);
    } catch (e) {
      setErr(`${(e as Error).message}. Is the backend running?`); setBusy(false);
    }
  };
  const demo = () => { useRiskStore.getState().setResult(MOCK_RESULT); router.push(RESULTS_ROUTE); };

  const s = STEPS[step];
  return (
    <main>
      <Disclaimer />
      <div className="mx-auto max-w-2xl px-6 py-12">
        {busy ? <Loader /> : (<>
          <div className="mb-8 flex gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((x, i) => <div key={x.title} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-teal-400" : "bg-white/10"}`} />)}
          </div>
          <h1 className="font-display text-3xl">{s.title}</h1>
          <p className="mt-1 text-sm text-slate-400">Step {step + 1} of {STEPS.length}. Every field is optional; blanks are imputed.</p>
          <div key={step} className="fade-up mt-6 grid gap-4 sm:grid-cols-2">
            {s.fields.map((f) => (
              <label key={f.k} className="text-sm text-slate-300">
                {f.label} {f.unit && <span className="text-slate-500">({f.unit})</span>}
                {f.type ? (
                  <select className={inp} value={v[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)}>
                    <option value="">-</option>
                    {f.type === "sex" ? <><option value="Male">Male</option><option value="Female">Female</option></> : <><option value="1">Yes</option><option value="0">No</option></>}
                  </select>
                ) : <input type="number" className={inp} value={v[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />}
              </label>
            ))}
          </div>
          {err && <div role="alert" className="mt-6 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{err} <button onClick={demo} className="ml-2 underline">Use demo data</button></div>}
          <div className="mt-8 flex justify-between">
            <button disabled={!step} onClick={() => setStep(step - 1)} className="rounded-full border border-white/15 px-5 py-2 text-sm disabled:opacity-30">Back</button>
            {step < STEPS.length - 1
              ? <button onClick={() => setStep(step + 1)} className={btn}>Next</button>
              : <button onClick={submit} className={btn}>Predict risk</button>}
          </div>
        </>)}
      </div>
      <Footer />
    </main>
  );
}
