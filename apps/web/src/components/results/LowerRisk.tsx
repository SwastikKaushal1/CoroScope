"use client";

import { useEffect, useState } from "react";
import { Apple, Ban, Droplets, Footprints, Gauge, HeartHandshake, Scale, Stethoscope, TrendingDown, Users, Wind, type LucideIcon } from "lucide-react";
import { predict } from "@/lib/api";
import type { Payload, PredictionResponse } from "@/lib/types";

type Scenario = { title: string; detail: string; changes: Payload };
type Outcome = Scenario & { after: number };
type Tip = { icon: LucideIcon; title: string; why: string; urgent?: boolean };

const yes = (inputs: Payload, k: string) => inputs[k] === 1;
const num = (inputs: Payload, k: string) => (typeof inputs[k] === "number" ? (inputs[k] as number) : null);

/** Changes the models can re-run on, built only from values the person gave us. */
function scenarios(inputs: Payload): Scenario[] {
  const out: Scenario[] = [];
  if (yes(inputs, "Current Smoker")) out.push({ title: "Quit smoking", detail: "One of the biggest single changes for your heart.", changes: { "Current Smoker": 0, "EX-Smoker": 1 } });
  const bp = num(inputs, "BP");
  if (bp !== null && bp > 130) out.push({ title: "Bring blood pressure down to 120", detail: `Yours is ${bp}.`, changes: { BP: 120 } });
  const w = num(inputs, "Weight"), h = num(inputs, "Length"), bmi = num(inputs, "BMI");
  if (w !== null && h !== null && bmi !== null && bmi >= 25) {
    const target = Math.round(24.9 * (h / 100) ** 2);
    out.push({ title: `Reach a healthy weight (about ${target} kg)`, detail: `About ${Math.round(w - target)} kg above the healthy range for your height.`, changes: { Weight: target, BMI: 24.9, Obesity: 0 } });
  }
  const ldl = num(inputs, "LDL");
  if (ldl !== null && ldl > 100) out.push({ title: "Lower LDL cholesterol below 100", detail: `Yours is ${ldl} mg/dL.`, changes: { LDL: 95 } });
  const fbs = num(inputs, "FBS");
  if (fbs !== null && fbs > 100) out.push({ title: "Bring fasting sugar into the normal range", detail: `Yours is ${fbs} mg/dL; normal is under 100.`, changes: { FBS: 95 } });
  if (out.length > 1) out.push({ title: "All of these together", detail: "Small changes add up.", changes: Object.assign({}, ...out.map((s) => s.changes)) });
  return out;
}

/** Guideline-based steps tailored to what the person told us, each with the reason it's shown. */
function tips(inputs: Payload, tested: Set<string>): Tip[] {
  const t: Tip[] = [];
  if (yes(inputs, "Typical Chest Pain")) t.push({ icon: Stethoscope, urgent: true, title: "See a doctor soon about your chest pain", why: "Chest pain that comes with effort and eases with rest should always be checked." });
  if (yes(inputs, "Dyspnea") || yes(inputs, "Edema")) t.push({ icon: Wind, urgent: true, title: "Mention breathlessness or swelling to your doctor", why: "These can be signs the heart is under strain." });
  if (yes(inputs, "DM") && !tested.has("FBS")) t.push({ icon: Droplets, title: "Keep your diabetes well controlled", why: "You said you have diabetes. Take medicines as prescribed and check your HbA1c regularly." });
  if (yes(inputs, "HTN") && !tested.has("BP")) t.push({ icon: Gauge, title: "Keep your blood pressure below 130/80", why: "You said you have high blood pressure. Check it at home, cut down on salt and take medicines as prescribed." });
  if (yes(inputs, "DLP") && !tested.has("LDL")) t.push({ icon: TrendingDown, title: "Get your cholesterol checked and treated", why: "You said you have high cholesterol. Ask your doctor about a lipid test and whether you need a statin." });
  if (yes(inputs, "Current Smoker") && !tested.has("Current Smoker")) t.push({ icon: Ban, title: "Quit smoking", why: "You said you smoke. Stopping is one of the most powerful things you can do for your heart, at any age." });
  const bmi = num(inputs, "BMI");
  if (bmi !== null && bmi >= 25 && !tested.has("BMI")) t.push({ icon: Scale, title: "Aim for a healthy weight", why: `Your BMI is about ${Math.round(bmi)}. Losing even 5–10% of your weight helps blood pressure, sugar and cholesterol.` });
  if (yes(inputs, "EX-Smoker")) t.push({ icon: Ban, title: "Stay smoke-free", why: "You've already quit, which lowers your risk year by year. Avoid second-hand smoke too." });
  if (yes(inputs, "FH")) t.push({ icon: Users, title: "Tell your doctor about your family history", why: "Heart disease in close family raises your own risk, so earlier check-ups help." });
  t.push({ icon: Footprints, title: "Move for 30 minutes on most days", why: "Brisk walking counts. Regular activity lowers blood pressure, sugar and weight." });
  t.push({ icon: Apple, title: "Eat for your heart", why: "More vegetables, fruit, whole grains and pulses; less salt, sugar and fried food." });
  return t;
}

/**
 * "Your action plan": model-tested changes (before -> after) plus tailored, guideline-based
 * steps. There is always something useful to show, even with very few answers.
 */
export default function LowerRisk({ result }: { result: PredictionResponse }) {
  const inputs = result.inputs ?? {};
  const before = result.predictions.CAD.probability;
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);

  useEffect(() => {
    const list = scenarios(result.inputs ?? {});
    const ctrl = new AbortController();
    Promise.all(list.map((s) => predict({ ...result.inputs, ...s.changes }, ctrl.signal).then((r) => ({ ...s, after: r.predictions.CAD.probability }))))
      .then((res) => setOutcomes(res.filter((o) => before - o.after >= 0.01)))
      .catch(() => setOutcomes([])); // offline: just show the tailored steps
    return () => ctrl.abort();
  }, [result, before]);

  const tested = new Set((outcomes ?? []).flatMap((o) => Object.keys(o.changes)));
  const plan = tips(inputs, tested);
  const pct = (p: number) => `${Math.round(p * 100)}%`;

  return (
    <section className="card p-6 md:p-7" aria-labelledby="plan">
      <h3 id="plan" className="flex items-center gap-2 font-display text-3xl text-ink"><HeartHandshake className="size-6 text-heart" /> Your action plan</h3>

      {outcomes && outcomes.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Tested on your answers</p>
          <ul className="mt-2 flex flex-col gap-2">
            {outcomes.map((o) => (
              <li key={o.title} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sunken px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{o.title}</p>
                  <p className="text-xs text-ink-3">{o.detail}</p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">
                  <span className="text-ink-3">{pct(before)}</span><span className="mx-2 text-ink-3">→</span><span className="font-semibold text-good">{pct(o.after)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-3">Recommended for you</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {plan.map((t) => (
          <li key={t.title} className={`flex gap-3 rounded-2xl px-4 py-3 ${t.urgent ? "bg-bad-soft" : "bg-sunken"}`}>
            <t.icon className={`mt-0.5 size-5 shrink-0 ${t.urgent ? "text-bad" : "text-heart"}`} />
            <div>
              <p className={`text-sm font-semibold ${t.urgent ? "text-bad" : "text-ink"}`}>{t.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-ink-2">{t.why}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-ink-3">{outcomes?.length ? "Numbers above are model estimates, not promises. " : ""}Steps follow standard heart-health guidance. Plan any change with your doctor.</p>
    </section>
  );
}
