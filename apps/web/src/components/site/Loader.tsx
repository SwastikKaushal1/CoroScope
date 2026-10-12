"use client";
import { useEffect, useState } from "react";

const STEPS = ["Reading your answers…", "Filling gaps with typical values…", "Running the four heart models…", "Working out the reasons…", "Colouring your arteries…"];

/** Loading state: a beating ECG trace + rotating status text. Pass `label` for a fixed message. */
export default function Loader({ label }: { label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (label) return;
    const t = setInterval(() => setI((n) => (n + 1) % STEPS.length), 1200);
    return () => clearInterval(t);
  }, [label]);
  return (
    <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
      <svg viewBox="0 0 64 24" className="w-28">
        <path className="ecg" d="M0 12h16l4-9 7 18 5-12 4 3h28" fill="none" stroke="#d7263d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm text-ink-2">{label ?? STEPS[i]}</p>
    </div>
  );
}
