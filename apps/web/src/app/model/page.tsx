"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Loader from "@/components/site/Loader";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { ARTERIES } from "@/config/arteries";
import { featureDef } from "@/config/features";
import { FORM_ROUTE } from "@/config/routes";
import { API_URL, getMetrics } from "@/lib/api";
import { featureLabel, MODEL_NAMES } from "@/lib/format";
import type { MetricsResponse, Target } from "@/lib/types";

const TARGETS: Target[] = ["CAD", "LAD", "LCX", "RCA"];
/** Categorical slots validated on the light surface: CVD ΔE ≥ 9.2; aqua is under 3:1 contrast, so every value is also in the table. */
const SERIES: Record<Target, string> = { CAD: "#2a78d6", LAD: "#eb6834", LCX: "#1baf7a", RCA: "#4a3aa7" };
const NAME: Record<Target, string> = { CAD: "Overall CAD", LAD: "LAD", LCX: "LCX", RCA: "RCA" };
const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);

const card = "card p-6";
const axis = { stroke: "#c3cbd7", tick: { fill: "#475569", fontSize: 11 } };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { name: string; color: string; payload: { x: number; y: number } }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-paper/95 px-3 py-2 text-xs shadow-xl">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-ink-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink">{p.name}</span>
          <span className="font-mono">({f2(p.payload.x)}, {f2(p.payload.y)})</span>
        </div>
      ))}
    </div>
  );
}

function CurveChart({ series, xLabel, yLabel }: { series: { t: Target; points: { x: number; y: number }[] }[]; xLabel: string; yLabel: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
        <CartesianGrid stroke="#e6eaf0" strokeDasharray="0" />
        <XAxis type="number" dataKey="x" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} {...axis} label={{ value: xLabel, position: "insideBottom", offset: -12, fill: "#475569", fontSize: 11 }} />
        <YAxis type="number" dataKey="y" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} {...axis} label={{ value: yLabel, angle: -90, position: "insideLeft", offset: 16, fill: "#475569", fontSize: 11 }} />
        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#94a3b8" strokeDasharray="4 4" />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8" }} />
        <Legend verticalAlign="top" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12, color: "#475569" }} />
        {series.map(({ t, points }) => (
          <Line key={t} data={points} dataKey="y" name={NAME[t]} stroke={SERIES[t]} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#f8fafc", strokeWidth: 2 }} isAnimationActive={false} type="linear" />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function Confusion({ t, m }: { t: Target; m: MetricsResponse["targets"][Target] }) {
  const [[tn, fp], [fn, tp]] = m.test.confusion_matrix;
  const total = tn + fp + fn + tp;
  const pos = t === "CAD" ? "CAD" : "Stenosis";
  const cell = (n: number, good: boolean, label: string) => (
    <div className={`rounded-lg p-2 text-center ${good ? "bg-navy/10" : "bg-paper"}`} title={`${label}: ${n} of ${total}`}>
      <div className="font-mono text-lg text-ink">{n}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-3">{label}</div>
    </div>
  );
  return (
    <div className={card}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-ink">{NAME[t]}</h3>
        <span className="text-xs text-ink-3">cut-off {f2(m.threshold)}</span>
      </div>
      <div className="mt-3 grid grid-cols-[auto_1fr_1fr] items-center gap-1.5 text-xs">
        <span />
        <span className="text-center text-ink-3">Pred. normal</span>
        <span className="text-center text-ink-3">Pred. {pos.toLowerCase()}</span>
        <span className="pr-1 text-right text-ink-3">Normal</span>
        {cell(tn, true, "TN")}
        {cell(fp, false, "FP")}
        <span className="pr-1 text-right text-ink-3">{pos}</span>
        {cell(fn, false, "FN")}
        {cell(tp, true, "TP")}
      </div>
    </div>
  );
}

export default function ModelPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState("");
  const [shapTarget, setShapTarget] = useState<Target>("CAD");

  useEffect(() => { getMetrics().then(setData).catch((e) => setError((e as Error).message)); }, []);

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-10 lg:py-14">
        <p className="eyebrow">Model performance</p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-tight text-ink md:text-6xl">Validated honestly, reported in full.</h1>
        <p className="mt-4 max-w-3xl text-ink-2">
          Four independent classifiers (overall CAD + LAD, LCX, RCA stenosis) trained on the Z-Alizadeh Sani cohort.
          Every number below comes from a 20% stratified hold-out set that was touched once, after model selection.
        </p>

        {error && (
          <div role="alert" className="mt-8 rounded-xl border border-bad/30 bg-bad-soft p-4 text-sm text-bad">
            Couldn&rsquo;t load metrics from {API_URL}/metrics ({error}). Start the backend with <code className="font-mono">docker compose up --watch</code>.
          </div>
        )}
        {!data && !error && <Loader label="Loading evaluation results…" />}

        {data && (
          <div className="mt-10 flex flex-col gap-10">
            {/* Headline tiles */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Held-out ROC-AUC per target">
              {TARGETS.map((t) => {
                const m = data.targets[t];
                return (
                  <div key={t} className={card}>
                    <div className="flex items-center gap-2 text-sm text-ink-2">
                      <span className="h-0.5 w-4 rounded-full" style={{ background: SERIES[t] }} />{NAME[t]}
                    </div>
                    <p className="font-display mt-3 text-5xl text-ink">{f2(m.test.roc_auc)}</p>
                    <p className="text-xs text-ink-3">held-out ROC-AUC · 95% CI {f2(m.test.roc_auc_ci95[0])}–{f2(m.test.roc_auc_ci95[1])}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-ink-3">CV AUC</span><p className="font-mono text-ink">{f3(m.cv[m.model].roc_auc.mean)} ± {f2(m.cv[m.model].roc_auc.std)}</p></div>
                      <div><span className="text-ink-3">Baseline</span><p className="font-mono text-ink">{f2(m.cv_baseline_dummy.roc_auc.mean)}</p></div>
                      <div><span className="text-ink-3">Model</span><p className="text-ink">{MODEL_NAMES[m.model] ?? m.model}</p></div>
                      <div><span className="text-ink-3">Positives</span><p className="font-mono text-ink">{m.n_pos} / {m.n_pos + m.n_neg}</p></div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Full metrics table */}
            <section className={card}>
              <h2 className="text-lg font-medium text-ink">Classification metrics (held-out test set)</h2>
              <p className="mt-1 text-sm text-ink-2">Thresholded at each model&rsquo;s validated cut-off. Sensitivity = recall.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-3">
                      {["Target", "Model", "Accuracy", "Precision", "Sensitivity", "Specificity", "F1", "ROC-AUC", "PR-AUC", "Brier ↓"].map((h, i) => (
                        <th key={h} className={`pb-2 font-medium ${i > 1 ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TARGETS.map((t) => {
                      const m = data.targets[t].test;
                      return (
                        <tr key={t} className="border-b border-line">
                          <td className="py-2.5 text-ink">{NAME[t]}</td>
                          <td className="py-2.5 text-ink-2">{MODEL_NAMES[data.targets[t].model]}</td>
                          {[m.accuracy, m.precision, m.recall, m.specificity, m.f1, m.roc_auc, m.pr_auc, m.brier].map((v, i) => (
                            <td key={i} className="py-2.5 text-right font-mono tabular-nums text-ink">{f3(v)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Curves */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className={card}>
                <h2 className="text-lg font-medium text-ink">ROC curves</h2>
                <p className="mt-1 text-sm text-ink-2">Dashed diagonal = random guessing.</p>
                <CurveChart xLabel="False positive rate" yLabel="True positive rate"
                  series={TARGETS.map((t) => ({ t, points: data.targets[t].test.roc_curve.fpr.map((x, i) => ({ x, y: data.targets[t].test.roc_curve.tpr[i] })) }))} />
              </div>
              <div className={card}>
                <h2 className="text-lg font-medium text-ink">Calibration</h2>
                <p className="mt-1 text-sm text-ink-2">Predicted vs observed frequency (quantile bins). On the diagonal = a 70% prediction comes true ~70% of the time.</p>
                <CurveChart xLabel="Mean predicted probability" yLabel="Observed fraction positive"
                  series={TARGETS.map((t) => ({ t, points: data.targets[t].test.calibration.prob_pred.map((x, i) => ({ x, y: data.targets[t].test.calibration.prob_true[i] })) }))} />
              </div>
            </section>

            {/* Confusion matrices */}
            <section>
              <h2 className="text-lg font-medium text-ink">Confusion matrices</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {TARGETS.map((t) => <Confusion key={t} t={t} m={data.targets[t]} />)}
              </div>
            </section>

            {/* Model comparison + global SHAP */}
            <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <div className={card}>
                <h2 className="text-lg font-medium text-ink">Model selection (5×5 repeated CV)</h2>
                <p className="mt-1 text-sm text-ink-2">Mean ROC-AUC on the training split. Highest wins; near-ties go to F1.</p>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-3">
                      <th className="pb-2 font-medium">Target</th>
                      {Object.keys(data.targets.CAD.cv).map((n) => <th key={n} className="pb-2 text-right font-medium">{MODEL_NAMES[n] ?? n}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TARGETS.map((t) => (
                      <tr key={t} className="border-b border-line">
                        <td className="py-2.5 text-ink">{NAME[t]}</td>
                        {Object.entries(data.targets[t].cv).map(([n, r]) => (
                          <td key={n} className={`py-2.5 text-right font-mono tabular-nums ${n === data.targets[t].model ? "text-heart" : "text-ink-2"}`}>
                            {f3(r.roc_auc.mean)}{n === data.targets[t].model && " ✓"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={card}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-lg font-medium text-ink">Global feature importance (mean |SHAP|)</h2>
                  <div role="tablist" aria-label="Target" className="flex rounded-lg border border-line p-0.5 text-xs">
                    {TARGETS.map((t) => (
                      <button key={t} role="tab" aria-selected={shapTarget === t} onClick={() => setShapTarget(t)}
                        className={`rounded-md px-2.5 py-1 ${shapTarget === t ? "bg-sunken text-ink" : "text-ink-2 hover:text-ink"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <ol className="mt-4 flex flex-col gap-2">
                  {data.targets[shapTarget].global_importance.slice(0, 12).map((g, i, arr) => (
                    <li key={g.feature} className="grid grid-cols-[minmax(0,11rem)_1fr_3rem] items-center gap-3 text-sm" title={`${featureLabel(g.feature)}: ${(g.importance * 100).toFixed(1)}% of total |SHAP|`}>
                      <span className="truncate text-ink-2">{featureLabel(g.feature)} <span className="font-mono text-[10px] text-ink-3">{featureDef(g.feature)?.clinical ?? (featureDef(g.feature) ? "" : g.feature)}</span></span>
                      <span className="h-2 rounded-r" style={{ width: `${(g.importance / arr[0].importance) * 100}%`, background: SERIES[shapTarget] }} />
                      <span className="text-right font-mono text-xs text-ink-2">{(g.importance * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* Methodology */}
            <section className={card}>
              <h2 className="text-lg font-medium text-ink">Validation design</h2>
              <ol className="mt-4 grid gap-4 text-sm leading-6 text-ink-2 md:grid-cols-2">
                {[
                  ["No target leakage", "LAD, LCX, RCA and Cath are removed before any model sees the data, enforced by an assertion and a unit test."],
                  ["Untouched test set", `80/20 stratified split (seed ${data.meta.seed}). The 20% is scored once, after model selection.`],
                  ["Model selection", "L1 logistic regression, random forest and XGBoost compared by 5×5 repeated stratified CV, with all preprocessing inside each fold."],
                  ["Calibrated probabilities", "Platt (sigmoid) calibration, so artery colours reflect real probabilities rather than raw scores."],
                  ["Validated cut-offs", "Each decision threshold maximises Youden's J on out-of-fold training predictions, never on the test set."],
                  ["Uncertainty", "ROC-AUC 95% CIs from 1,000 bootstrap resamples of the test set. A prior-only dummy classifier is the baseline."],
                ].map(([h, b], i) => (
                  <li key={h} className="flex gap-3">
                    <span className="font-mono text-xs text-heart">0{i + 1}</span>
                    <span><span className="text-ink">{h}.</span> {b}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-xs text-ink-3">
                {data.meta.n_rows} patients · {data.meta.n_features} input features · scikit-learn {data.meta.sklearn} · {data.meta.tuned ? "hyper-parameters tuned by randomized search" : "default hyper-parameters"}.
                The deployed models are refit on all {data.meta.n_rows} rows after evaluation.
              </p>
            </section>

            <div className="flex flex-wrap gap-3">
              <Link href={FORM_ROUTE} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-2">Try the model</Link>
              <span className="self-center text-xs text-ink-3">Vessel paths on the 3D heart: {ARTERIES.map((a) => a.id).join(", ")}, the same keys the API returns.</span>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
