"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Report from "@/components/report/Report";
import { BRAND } from "@/config/brand";
import { RESULTS_ROUTE } from "@/config/routes";
import { fmtValue } from "@/lib/format";
import QRCode from "qrcode";
import { MOCK_RESULT } from "@/lib/mockResult";
import { shareUrl } from "@/lib/share";
import type { Patient } from "@/lib/types";
import { useRiskStore } from "@/store/useRiskStore";

/** Capture each A4 page of the report and save one PDF file. Libraries load only on click. */
async function downloadPdf(fileName: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const pages = Array.from(document.querySelectorAll<HTMLElement>("#report .r-page"));
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  for (const [i, page] of pages.entries()) {
    const zoom = page.style.zoom;
    page.style.zoom = "1"; // capture at full A4 size even on phones
    const canvas = await html2canvas(page, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    page.style.zoom = zoom;
    if (i > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297);
  }
  pdf.save(fileName);
}

/**
 * /report: two-page A4 report from the stored API result. "Download PDF" saves a file directly;
 * "Print" uses the browser dialog (print CSS shows only the pages). Dev: /report?demo.
 */
export default function ReportPage() {
  const result = useRiskStore((s) => s.result);
  const patient = useRiskStore((s) => s.patient);
  const snapshot = useRiskStore((s) => s.snapshot);
  const [meta, setMeta] = useState<{ no: string; date: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  // QR on the printed report that re-opens these results in the interactive app.
  useEffect(() => {
    if (!result) return;
    let alive = true;
    shareUrl(result.inputs ?? {})
      .then((u) => QRCode.toDataURL(u, { margin: 0, width: 360, errorCorrectionLevel: "M" }))
      .then((img) => { if (alive) setQr(img); })
      .catch(() => {});
    return () => { alive = false; };
  }, [result]);

  useEffect(() => {
    const st = useRiskStore.getState();
    if (!st.result && new URLSearchParams(window.location.search).has("demo")) st.setResult(MOCK_RESULT);
    // Prefill age/sex from the model inputs when the header fields are blank.
    const inputs = useRiskStore.getState().result?.inputs ?? {};
    const fill: Partial<Patient> = {};
    if (!st.patient.age && inputs.Age !== undefined) fill.age = String(inputs.Age);
    if (!st.patient.sex && inputs.Sex !== undefined) fill.sex = fmtValue("Sex", inputs.Sex);
    if (Object.keys(fill).length) st.setPatient(fill);
    // Generated client-side only (random/date would mismatch the server HTML).
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeta({
      no: `CS-${d.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    });
  }, []);

  // The browser uses the page title as the default file name when printing.
  const fileBase = `${BRAND}-report-${(patient.name || "patient").replace(/[^\w-]+/g, "-")}`;
  useEffect(() => { document.title = fileBase; }, [fileBase]);

  if (!meta) return <div className="min-h-dvh" />;

  if (!result) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl">No report yet</h1>
        <Link href={RESULTS_ROUTE} className="btn btn-primary h-11 px-6 text-sm">Back to results</Link>
      </main>
    );
  }

  const save = async () => {
    setBusy(true);
    try { await downloadPdf(`${fileBase}.pdf`); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-dvh bg-sunken pb-16">
      <div className="no-print sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[210mm] items-center gap-3 px-4 py-3">
          <Link href={RESULTS_ROUTE} className="flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"><ArrowLeft className="size-4" /> Results</Link>
          <span className="ml-auto" />
          <button onClick={() => window.print()} className="btn btn-ghost h-10 px-4 text-sm"><Printer className="size-4" /> Print</button>
          <button onClick={save} disabled={busy} className="btn btn-primary h-10 px-5 text-sm"><Download className="size-4" />{busy ? "Preparing…" : "Download PDF"}</button>
        </div>
      </div>
      <div className="px-3 pt-8 print:p-0">
        <Report result={result} patient={patient} snapshot={snapshot} reportNo={meta.no} dateLabel={meta.date} qr={qr} />
      </div>
    </div>
  );
}
