"use client";
import { useEffect, useState } from "react";

const STEPS = ["Reading your inputs…", "Filling gaps with cohort medians…", "Running vessel models…", "Computing SHAP explanations…", "Painting the arteries…"];

/** Loading state: animated ECG trace + rotating status text. Pass `label` for a fixed message. */
export default function Loader({ label }: { label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (label) return;
    const t = setInterval(() => setI((n) => (n + 1) % STEPS.length), 1400);
    return () => clearInterval(t);
  }, [label]);
  return (
    <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="relative grid h-28 w-28 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
        <span className="absolute inset-3 animate-spin rounded-full border border-teal-400/30 border-t-teal-300" />
        <svg viewBox="0 0 64 24" className="w-16">
          <path className="ecg" d="M0 12h16l4-9 7 18 5-12 4 3h28" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm text-slate-400">{label ?? STEPS[i]}</p>
    </div>
  );
}
