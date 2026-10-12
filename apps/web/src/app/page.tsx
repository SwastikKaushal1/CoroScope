"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Check, FileText, HeartPulse, MousePointerClick, ShieldCheck, Sparkles } from "lucide-react";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { ARTERIES } from "@/config/arteries";
import { FORM_ROUTE, MODEL_ROUTE } from "@/config/routes";
import { getMetrics } from "@/lib/api";
import { MOCK_RESULT } from "@/lib/mockResult";
import { plainReasons, riskWord, strength } from "@/lib/reasons";
import { riskColorHex } from "@/lib/riskColor";
import type { MetricsResponse } from "@/lib/types";
import type { Probabilities } from "@/store/useRiskStore";

const Scene = dynamic(() => import("@/components/three/Scene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-3">Loading 3D heart…</div>,
});

/** Example profiles the hero heart cycles through, so visitors see the colours respond. */
const DEMO: { label: string; p: Probabilities }[] = [
  { label: "Three narrowed arteries", p: { LAD: MOCK_RESULT.predictions.LAD.probability, LCX: MOCK_RESULT.predictions.LCX.probability, RCA: MOCK_RESULT.predictions.RCA.probability } },
  { label: "Healthy arteries", p: { LAD: 0.12, LCX: 0.08, RCA: 0.1 } },
  { label: "One narrowed artery (front)", p: { LAD: 0.86, LCX: 0.22, RCA: 0.3 } },
];

function HeroHeart() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % DEMO.length), 4500);
    return () => clearInterval(t);
  }, []);
  const d = DEMO[i];
  return (
    <div className="relative h-[460px] overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] sm:h-[540px]">
      <Scene probabilities={d.p} zoom={false} />
      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-line bg-surface/90 px-4 py-2.5 backdrop-blur">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">Example</p>
        <p className="text-sm font-semibold text-ink">{d.label}</p>
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
        {ARTERIES.map((a) => (
          <span key={a.id} className="flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-xs text-ink backdrop-blur">
            <span className="size-2 rounded-full" style={{ background: riskColorHex(d.p[a.id]) }} />
            {a.supplies.replace(" of the heart", "")} · <b>{riskWord(d.p[a.id])}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { title: "Answer six questions", text: "Age, diabetes, blood pressure, smoking and chest pain, in everyday words. About 30 seconds, no reports needed." },
  { title: "Four AI models check your heart", text: "One for overall heart disease and one for each main artery. Each is trained on 303 real patients who had their arteries examined." },
  { title: "See it on a 3D heart", text: "Each artery lights up green, amber or red. Tap one to see what raised or lowered its risk, in plain words." },
];

const FEATURES = [
  { icon: MousePointerClick, title: "Your heart in 3D", text: "Rotate, zoom and tap each artery. Blood flow visibly slows in arteries that are likely narrowed." },
  { icon: Sparkles, title: "Reasons you can read", text: "Explainable AI (SHAP) turns every prediction into short sentences, like “your blood pressure raised the risk”." },
  { icon: HeartPulse, title: "Your action plan", text: "Steps tailored to your answers, plus changes the models re-test on your own data, like how much quitting smoking could lower your risk." },
  { icon: FileText, title: "A report for your doctor", text: "One click makes a clean, printable PDF with your 3D heart, results and reasons." },
];

export default function LandingPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  useEffect(() => { getMetrics().then(setMetrics).catch(() => {}); }, []);
  const auc = (t: "CAD" | "LAD" | "LCX" | "RCA") => metrics?.targets[t].test.roc_auc;
  const cadCv = metrics ? metrics.targets.CAD.cv[metrics.targets.CAD.model].roc_auc.mean : 0.93;
  const reasons = plainReasons(MOCK_RESULT.predictions.CAD.explanation, 4);

  return (
    <main className="min-h-dvh overflow-x-hidden">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:pt-16">
        <div>
          <p className="eyebrow"><HeartPulse className="size-4" /> Explainable heart AI</p>
          <h1 className="font-display mt-5 text-5xl leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
            See where your heart <em className="text-heart">may be at risk.</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-ink-2">
            Answer six simple questions. Coroscope estimates the chance of narrowed heart arteries, shows <b className="font-semibold text-ink">which</b> artery
            on a 3D heart, and explains <b className="font-semibold text-ink">why</b> in plain words.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={FORM_ROUTE} className="btn btn-primary h-13 px-7 text-base">Check my heart <ArrowRight className="size-4" /></Link>
            <Link href="#how" className="btn btn-ghost h-13 px-6 text-base">How it works</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            {["About 30 seconds", "No sign-up", "Nothing is stored"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-good" />{t}</li>
            ))}
          </ul>
        </div>
        <div><HeroHeart /></div>
      </section>

      {/* Proof strip */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            [cadCv.toFixed(2), "accuracy score (ROC-AUC) for heart disease, cross-validated"],
            ["303", "real patients the models learned from"],
            ["4", "AI models: overall heart + three arteries"],
            ["< 1 s", "from your answers to your 3D heart"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="font-display text-4xl text-ink">{v}</p>
              <p className="mt-1 text-xs leading-5 text-ink-3">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
        <p className="eyebrow">How it works</p>
        <h2 className="font-display mt-4 max-w-2xl text-4xl leading-tight text-ink md:text-5xl">Three steps, from answers to understanding.</h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-7">
              <span className="grid size-10 place-items-center rounded-full bg-heart-soft font-display text-xl text-heart">{i + 1}</span>
              <h3 className="mt-6 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Reasons preview */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Explainable, not a black box</p>
            <h2 className="font-display mt-4 text-4xl leading-tight text-ink md:text-5xl">Every result comes with its reasons.</h2>
            <p className="mt-5 text-lg leading-8 text-ink-2">
              We use SHAP, a standard method for explaining AI, to show which of your answers pushed the risk up or down.
              Doctors get the full technical breakdown; everyone else gets sentences like these.
            </p>
          </div>
          <div className="card p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.2)]">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-3">Example · a real patient from the dataset</p>
            <ul className="mt-4 flex flex-col gap-3">
              {reasons.map((r) => {
                const Icon = r.up ? ArrowUp : ArrowDown;
                return (
                  <li key={r.key} className="flex items-start gap-3 rounded-2xl bg-paper p-4 text-sm leading-6 text-ink-2">
                    <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${r.up ? "bg-bad-soft text-bad" : "bg-good-soft text-good"}`}><Icon className="size-4" /></span>
                    <span><b className="font-semibold text-ink">{r.label}</b> ({r.value}) {r.up ? "raised" : "lowered"} the risk {strength(r.share)}.</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="font-display max-w-2xl text-4xl leading-tight text-ink md:text-5xl">Made for people, trusted by numbers.</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article key={f.title} className="card flex gap-5 p-7">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-heart-soft text-heart"><f.icon className="size-5" /></span>
              <div>
                <h3 className="font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-2">{f.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Accuracy */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="card grid gap-10 p-8 md:p-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow"><ShieldCheck className="size-4" /> Tested honestly</p>
            <h2 className="font-display mt-4 text-4xl leading-tight text-ink">How accurate is it?</h2>
            <p className="mt-4 leading-7 text-ink-2">
              We kept 20% of patients aside and tested the models on them only once, at the very end. ROC-AUC measures how
              well a model tells sick from healthy: 0.5 is a coin flip, 1.0 is perfect.
            </p>
            <Link href={MODEL_ROUTE} className="btn btn-ghost mt-6 h-11 px-5 text-sm">See the full evaluation <ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            {(["CAD", "LAD", "LCX", "RCA"] as const).map((t) => (
              <div key={t} className="rounded-2xl bg-paper p-5">
                <p className="text-xs text-ink-3">{t === "CAD" ? "Heart disease overall" : ARTERIES.find((a) => a.id === t)!.supplies.replace(" of the heart", "") + " artery"}</p>
                <p className="font-display mt-1 text-4xl text-ink">{auc(t) !== undefined ? auc(t)!.toFixed(2) : "—"}</p>
                <p className="text-[11px] text-ink-3">ROC-AUC on unseen patients</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl text-ink md:text-5xl">Your heart, explained in 30 seconds.</h2>
          <p className="mt-4 max-w-lg text-ink-2">No reports, no sign-up. Results are a guide to talk through with a doctor, not a diagnosis.</p>
          <Link href={FORM_ROUTE} className="btn btn-primary mt-8 h-13 px-7 text-base">Check my heart <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
