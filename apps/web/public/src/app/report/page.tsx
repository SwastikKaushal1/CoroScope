"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/brand/Logo";
import Report from "@/components/report/Report";
import { BRAND } from "@/config/brand";
import { RESULTS_ROUTE } from "@/config/routes";
import { fmtValue } from "@/lib/format";
import { MOCK_RESULT } from "@/lib/mockResult";
import type { Patient } from "@/lib/types";
import { useRiskStore } from "@/store/useRiskStore";

const FIELDS: [keyof Patient, string][] = [
  ["name", "Patient name"], ["id", "Patient ID"], ["doctor", "Referring doctor"], ["age", "Age"], ["sex", "Sex"],
];

/**
 * /report — A4 report built from the stored API result. "Download PDF" opens the
 * browser print dialog (choose "Save as PDF"); print CSS hides everything but the report.
 * Dev: /report?demo previews with sample data.
 */
export default function ReportPage() {
  const result = useRiskStore((s) => s.result);
  const patient = useRiskStore((s) => s.patient);
  const snapshot = useRiskStore((s) => s.snapshot);
  const setPatient = useRiskStore((s) => s.setPatient);
  const [meta, setMeta] = useState<{ no: string; date: string } | null>(null);

  useEffect(() => {
    const st = useRiskStore.getState();
    if (!st.result && new URLSearchParams(window.location.search).has("demo")) st.setResult(MOCK_RESULT);
    // Prefill age/sex from the explanation values when the user left them blank.
    const vals = new Map<string, number>();
    Object.values(useRiskStore.getState().result?.predictions ?? {}).forEach((p) =>
      p.explanation.forEach((e) => e.value !== null && vals.set(e.feature, e.value))
    );
    const fill: Partial<Patient> = {};
    if (!st.patient.age && vals.has("Age")) fill.age = String(vals.get("Age"));
    if (!st.patient.sex && vals.has("Sex")) fill.sex = fmtValue("Sex", vals.get("Sex")!);
    if (Object.keys(fill).length) st.setPatient(fill);
    // Generated client-side only (random/date would mismatch the server HTML).
    const d = new Date();
    setMeta({
      no: `CS-${d.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    });
  }, []);

  // The browser uses the page title as the default PDF file name.
  useEffect(() => {
    document.title = `${BRAND} report - ${patient.name || "patient"}`;
  }, [patient.name]);

  if (!meta) return <div className="min-h-dvh" />;

  if (!result) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl">No report to show yet</h1>
        <Link href={RESULTS_ROUTE} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900">Back to results</Link>
      </main>
    );
  }

  return (
    <div className="min-h-dvh pb-10">
      <div className="no-print border-b border-white/10 bg-slate-950/80 px-5 py-3">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-end gap-3">
          <Link href={RESULTS_ROUTE} className="mr-2 flex items-center gap-2 self-center text-sm text-slate-300 hover:text-white">
            <Logo size={24} /> ← Results
          </Link>
          {FIELDS.map(([k, label]) => (
            <label key={k} className={`text-xs text-slate-400 ${k === "age" || k === "sex" ? "w-24" : "w-40"}`}>
              {label}
              <input
                value={patient[k]}
                onChange={(e) => setPatient({ [k]: e.target.value })}
                className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
          ))}
          <button onClick={() => window.print()} className="ml-auto rounded-lg bg-[#0E8F8A] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
            Download PDF
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-[210mm] text-[11px] text-slate-500">
          In the print dialog choose &ldquo;Save as PDF&rdquo; as the destination. Turn on &ldquo;Background graphics&rdquo; if colours are missing.
        </p>
      </div>
      <div className="px-3 pt-6 print:p-0">
        <Report result={result} patient={patient} snapshot={snapshot} reportNo={meta.no} dateLabel={meta.date} />
      </div>
    </div>
  );
}
