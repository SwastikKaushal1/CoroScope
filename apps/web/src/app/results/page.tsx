"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Brand from "@/components/brand/Brand";
import { captureHeart } from "@/lib/snapshot";
import Disclaimer from "@/components/brand/SafetyBanner";
import Explanation from "@/components/results/Explanation";
import Summary from "@/components/results/Summary";
import { FORM_ROUTE, REPORT_ROUTE } from "@/config/routes";
import { MOCK_RESULT } from "@/lib/mockResult";
import { useRiskStore } from "@/store/useRiskStore";

// three.js needs WebGL (browser only), so the canvas is never rendered on the server.
const Scene = dynamic(() => import("@/components/three/Scene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading your heart…</div>,
});

/**
 * /results — where the form sends the user after the API call.
 *   Form:   useRiskStore.getState().setResult(data); router.push("/results");
 *   Dev:    open /results?demo to preview with sample data (no backend needed).
 */
export default function ResultsPage() {
  const result = useRiskStore((s) => s.result);
  const patient = useRiskStore((s) => s.patient);
  const router = useRouter();
  const [ready, setReady] = useState(false); // wait for client so sessionStorage state matches the server HTML

  useEffect(() => {
    const { result: saved, setResult } = useRiskStore.getState();
    if (!saved && new URLSearchParams(window.location.search).has("demo")) setResult(MOCK_RESULT);
    setReady(true);
  }, []);

  // Photograph the 3D view first (it only exists on this page), then open the report.
  const openReport = () => {
    useRiskStore.getState().setSnapshot(captureHeart());
    router.push(REPORT_ROUTE);
  };

  if (!ready) return <div className="h-dvh" />;

  if (!result) {
    return (
      <div className="flex h-dvh flex-col bg-slate-950 text-slate-100">
        <Disclaimer />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-3xl">No results to show yet</h1>
          <p className="max-w-sm text-sm text-slate-400">Complete the health check to see your heart results.</p>
          <div className="flex gap-3">
            <Link href={FORM_ROUTE} className="rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200">
              Start a health check
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-slate-100">
      <Disclaimer />
      <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/85 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Brand onClick={() => router.push(FORM_ROUTE)} />
          <span className="hidden text-sm text-slate-400 sm:inline">
            {[patient.name, patient.age && `${patient.age} yr`, patient.sex].filter(Boolean).join(" · ") || "Your heart results"}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={openReport} className="rounded-lg bg-teal-300 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-200">
            Download report
          </button>
          <Link href={FORM_ROUTE} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm transition hover:bg-white/10">
            New check
          </Link>
        </div>
      </header>

      {/* Mobile: one scrolling column (summary, heart, explanation). Desktop: three fixed columns. */}
      <main className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[320px_minmax(0,1fr)_400px] lg:grid-rows-1 lg:overflow-hidden">
        <Summary result={result} />

        <section className="relative h-[62dvh] min-h-[360px] lg:h-auto lg:min-h-0">
          <Scene />
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
            Low
            <span className="h-1.5 w-20 rounded-full" style={{ background: "linear-gradient(90deg,#2fbf86,#f5b83d,#ef4452)" }} />
            High
          </div>
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
            Drag to turn the heart · Scroll or pinch to zoom · Tap an artery
          </p>
        </section>

        <Explanation result={result} />
      </main>
    </div>
  );
}
