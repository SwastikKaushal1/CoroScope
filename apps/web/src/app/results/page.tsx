"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Download, QrCode, Stethoscope } from "lucide-react";
import Loader from "@/components/site/Loader";
import SafetyBanner from "@/components/brand/SafetyBanner";
import SiteHeader from "@/components/site/SiteHeader";
import Explanation from "@/components/results/Explanation";
import HeartAge from "@/components/results/HeartAge";
import Reasons from "@/components/results/Reasons";
import Verdict from "@/components/results/Verdict";
import LowerRisk from "@/components/results/LowerRisk";
import ShareDialog from "@/components/results/ShareDialog";
import { FORM_ROUTE, MODEL_ROUTE, REPORT_ROUTE } from "@/config/routes";
import { predict } from "@/lib/api";
import { fmtValue } from "@/lib/format";
import { MOCK_RESULT } from "@/lib/mockResult";
import { decodeShare, SHARE_PREFIX } from "@/lib/share";
import { captureHeart } from "@/lib/snapshot";
import { useRiskStore } from "@/store/useRiskStore";

// three.js needs WebGL (browser only), so the canvas is never rendered on the server.
const Scene = dynamic(() => import("@/components/three/Scene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-ink-3">Loading your heart…</div>,
});

/**
 * /results: one column that reads top to bottom.
 *   1. The answer + the three arteries, next to the 3D heart
 *   2. Why (plain-language SHAP reasons)
 *   3. Your action plan + next steps
 *   4. Technical details for doctors (collapsed)
 * Dev: /results?demo previews with a saved real prediction (no backend needed).
 * Shared links (/results#s=...) carry the answers in the URL fragment; the models are re-run here.
 */
export default function ResultsPage() {
  const result = useRiskStore((s) => s.result);
  const patient = useRiskStore((s) => s.patient);
  const router = useRouter();
  const [ready, setReady] = useState(false); // wait for client so sessionStorage state matches the server HTML
  const [shared, setShared] = useState(false); // opened from someone's share link
  const [shareError, setShareError] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const { result: saved, setResult } = useRiskStore.getState();
    const hash = window.location.hash;
    if (hash.startsWith(SHARE_PREFIX)) {
      // Re-run the models on the shared answers, then show the results as usual.
      decodeShare(hash.slice(SHARE_PREFIX.length))
        .then((inputs) => {
          if (!inputs) throw new Error("This share link is damaged or incomplete.");
          return predict(inputs).then((r) => {
            const age = inputs.Age !== undefined ? String(inputs.Age) : "";
            const sex = inputs.Sex !== undefined ? fmtValue("Sex", inputs.Sex) : "";
            setResult({ ...r, patient: { name: "", age, sex } });
            setShared(true);
          });
        })
        .catch((e) => setShareError((e as Error).message))
        .finally(() => setReady(true));
      return;
    }
    if (!saved && new URLSearchParams(window.location.search).has("demo")) setResult(MOCK_RESULT);
    // One-time client-only flag: sessionStorage isn't readable during server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  // Photograph the 3D view first (it only exists on this page), then open the report.
  const openReport = () => {
    useRiskStore.getState().setSnapshot(captureHeart());
    router.push(REPORT_ROUTE);
  };

  if (!ready) return <div className="min-h-dvh"><SafetyBanner /><Loader label="Opening results…" /></div>;

  if (!result) {
    return (
      <div className="flex h-dvh flex-col bg-paper text-ink">
        <SafetyBanner />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-4xl">{shareError ? "Couldn't open this link" : "No results yet"}</h1>
          <p className="max-w-sm text-sm text-ink-2">{shareError || "Answer six quick questions to see your heart results."}</p>
          <Link href={FORM_ROUTE} className="btn btn-primary h-11 px-6 text-sm">Start the quick check</Link>
        </main>
      </div>
    );
  }

  const who = [patient.name, patient.age && `${patient.age} yr`, patient.sex].filter(Boolean).join(" · ");

  return (
    <div className="min-h-dvh">
      <SiteHeader right={
        <div className="flex items-center gap-2">
          {who && <span className="mr-2 hidden max-w-48 truncate text-sm text-ink-3 lg:inline">{who}</span>}
          <Link href={FORM_ROUTE} className="btn btn-ghost hidden h-10 px-4 text-sm sm:inline-flex">New check</Link>
          <button onClick={() => setSharing(true)} className="btn btn-ghost h-10 px-3 text-sm"><QrCode className="size-4" /><span className="hidden sm:inline">Share</span></button>
          <button onClick={openReport} className="btn btn-primary h-10 px-4 text-sm"><Download className="size-4" /><span className="hidden sm:inline">Download report</span><span className="sm:hidden">PDF</span></button>
        </div>
      } />

      {sharing && <ShareDialog result={result} onClose={() => setSharing(false)} />}
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 lg:py-14">
        {shared && (
          <p className="-mb-10 rounded-xl border border-heart/20 bg-heart-soft px-4 py-3 text-sm text-ink-2">
            <b className="text-ink">Shared with you.</b> These results were re-calculated from answers in the link you opened. No name is included.
          </p>
        )}
        {/* 1. The answer, next to the heart */}
        <section className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Verdict result={result} />
          <div className="relative h-[440px] overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)] lg:sticky lg:top-24 lg:h-[600px]">
            <Scene />
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-[11px] text-ink-2 backdrop-blur">
              Low <span className="h-1.5 w-16 rounded-full" style={{ background: "linear-gradient(90deg,#1fa874,#eba327,#d7263d)" }} /> High
            </div>
            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface/90 px-3 py-1.5 text-[11px] text-ink-2 backdrop-blur">
              Drag to turn · scroll to zoom · tap an artery
            </p>
          </div>
        </section>

        {/* 1b. Heart age (Framingham) */}
        <HeartAge result={result} />

        {/* 2. Why */}
        <Reasons result={result} />

        {/* 3. Action plan + next steps */}
        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <LowerRisk result={result} />
          <div className="card p-6 md:p-7">
            <h3 className="flex items-center gap-2 font-display text-2xl text-ink"><Stethoscope className="size-5 text-heart" /> What to do next</h3>
            <ol className="mt-4 flex flex-col gap-4 text-sm leading-6 text-ink-2">
              {[
                <><button onClick={() => setSharing(true)} className="font-semibold text-heart underline underline-offset-2">Share with your doctor</button> by QR code. Only tests such as an angiogram can confirm narrowed arteries.</>,
                <><button onClick={openReport} className="font-semibold text-heart underline underline-offset-2">Download your report</button> to take with you.</>,
                <>Have test results? <Link href={FORM_ROUTE} className="font-semibold text-heart underline underline-offset-2">Add them</Link> for a more precise answer.</>,
              ].map((t, i) => (
                <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-sunken text-xs font-semibold text-ink">{i + 1}</span><span>{t}</span></li>
              ))}
            </ol>
            <p className="mt-5 rounded-2xl bg-bad-soft px-4 py-3 text-sm leading-6 text-bad">Chest pain right now, or pain with sweating or breathlessness? <b>Call emergency services.</b></p>
          </div>
        </section>

        {/* 4. For doctors */}
        <details className="group card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 md:px-6">
            <span>
              <span className="block font-display text-2xl text-ink">Technical details for doctors</span>
              <span className="block text-sm text-ink-3">SHAP values, decision cut-offs and every measurement with its effect.</span>
            </span>
            <ChevronDown className="size-5 shrink-0 text-ink-2 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-line p-5 md:p-6">
            <Explanation result={result} />
            <Link href={MODEL_ROUTE} className="mt-6 inline-block text-sm font-semibold text-heart underline underline-offset-2">How accurate is the model? →</Link>
          </div>
        </details>

        <p className="text-center text-xs text-ink-3">{result.disclaimer}</p>
      </main>
    </div>
  );
}
