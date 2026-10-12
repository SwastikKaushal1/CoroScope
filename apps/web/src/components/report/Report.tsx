"use client";

import { ARTERIES } from "@/config/arteries";
import Logo from "@/components/brand/Logo";
import { featureLabel, fmtValue, MODEL_NAMES } from "@/lib/format";
import { fmtHeartAge, heartAgeFromInputs } from "@/lib/heartAge";
import { plainReasons, riskWord, strength } from "@/lib/reasons";
import { riskColorHex } from "@/lib/riskColor";
import type { Patient, PredictionResponse, Target } from "@/lib/types";
import "./report.css";

const pct = (p: number) => `${Math.round(p * 100)}%`;
const dash = (s: string) => s.trim() || "—";
const BAND_CLASS: Record<string, string> = { Low: "low", Medium: "mid", High: "high" };

/** Fallback picture when no 3D snapshot exists (e.g. report opened directly). */
function Schematic({ r }: { r: PredictionResponse }) {
  const c = (k: "LAD" | "LCX" | "RCA") => riskColorHex(r.predictions[k].probability);
  return (
    <svg viewBox="0 0 200 190" role="img" aria-label="Schematic of the coronary arteries coloured by risk">
      <path d="M100 172C40 128 18 94 18 62 18 36 38 22 60 22 78 22 92 32 100 46 108 32 122 22 140 22 162 22 182 36 182 62 182 94 160 128 100 172Z" fill="#F6E3E2" stroke="#D9B9B6" strokeWidth="2" />
      <g fill="none" strokeWidth="8" strokeLinecap="round">
        <path d="M100 42C96 80 88 105 84 140" stroke={c("LAD")} />
        <path d="M97 44C70 50 44 66 38 102" stroke={c("LCX")} />
        <path d="M104 44C140 44 166 62 161 100 159 116 151 128 141 140" stroke={c("RCA")} />
      </g>
    </svg>
  );
}

function Header({ reportNo, dateLabel, page }: { reportNo: string; dateLabel: string; page: number }) {
  return (
    <header className="r-head">
      <div className="r-brand"><Logo size={30} /><span>Coroscope</span></div>
      <div className="r-meta">Heart risk report · {reportNo}<br />{dateLabel} · Page {page} of 2</div>
    </header>
  );
}

function Footer({ disclaimer }: { disclaimer: string }) {
  return <footer className="r-foot">{disclaimer}</footer>;
}

/**
 * The downloadable report: two fixed A4 pages (.r-page). The PDF button captures each page
 * as one PDF page, so the layout here is exactly what lands in the file.
 */
export default function Report({ result, patient, snapshot, reportNo, dateLabel, qr }: {
  result: PredictionResponse; patient: Patient; snapshot: string | null; reportNo: string; dateLabel: string;
  /** QR code (data URL) that opens these results in the interactive app. */
  qr?: string | null;
}) {
  const P = result.predictions;
  const cad = P.CAD;
  const band = riskWord(cad.probability);
  const given = Object.keys(result.inputs ?? {}).length;
  const total = given + result.imputed_fields.length;
  const top = [...ARTERIES].sort((a, b) => P[b.id].probability - P[a.id].probability)[0];
  const reasons = plainReasons(cad.explanation, 5);
  const ha = heartAgeFromInputs(result.inputs ?? {});

  return (
    <div className="rpt" id="report">
      {/* ---------------- Page 1: the answer ---------------- */}
      <section className="r-page">
        <Header reportNo={reportNo} dateLabel={dateLabel} page={1} />

        <table className="r-patient"><tbody><tr>
          <td><small>Name</small>{dash(patient.name)}</td>
          <td><small>Age</small>{dash(patient.age)}</td>
          <td><small>Sex</small>{dash(patient.sex)}</td>
          <td><small>Details given</small>{given} of {total}</td>
        </tr></tbody></table>

        <div className="r-verdict">
          <p className="r-eyebrow">Result</p>
          <h1>{cad.predicted_positive ? <>Signs point to <em>coronary artery disease</em></> : <>Coronary artery disease looks <em className="good">unlikely</em></>}</h1>
          <div className="r-row">
            <span className={`r-pill ${BAND_CLASS[band]}`}>{band} risk · {pct(cad.probability)}</span>
            <span className="r-muted">About {Math.round(cad.probability * 100)} out of 100 people with these answers had narrowed heart arteries.</span>
          </div>
          <div className="r-meter"><i style={{ left: `${Math.min(98, Math.max(2, cad.probability * 100))}%` }} /></div>
          <div className="r-meter-l"><span>Low</span><span>Medium</span><span>High</span></div>
          {ha && (
            <p className="r-heartage">
              <b>Heart age {fmtHeartAge(ha.heartAge)}</b> · real age {ha.age}
              <span className="r-muted"> (Framingham formula from age, sex, blood pressure, weight, smoking and diabetes{ha.assumed.length ? `; assumed: ${ha.assumed.join(", ")}` : ""})</span>
            </p>
          )}
        </div>

        <h2>The three heart arteries</h2>
        <div className="r-two">
          <figure className="r-fig">
            {snapshot
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={snapshot} alt="3D heart with arteries coloured by risk" />
              : <Schematic r={result} />}
            <figcaption>Arteries coloured by risk: green low, amber medium, red high</figcaption>
          </figure>
          <div className="r-arteries">
            {ARTERIES.map((a) => {
              const p = P[a.id];
              const w = riskWord(p.probability);
              return (
                <div key={a.id} className="r-artery">
                  <span className="r-dot" style={{ background: riskColorHex(p.probability) }} />
                  <div className="r-artery-name"><b>{a.supplies}</b><small>{a.label} ({a.id})</small></div>
                  <span className={`r-pill ${BAND_CLASS[w]}`}>{w} · {pct(p.probability)}</span>
                </div>
              );
            })}
            <p className="r-muted">
              Highest risk: <b>{top.supplies.toLowerCase()}</b> ({top.id}, {pct(P[top.id].probability)}).
              {given < total / 2 && " Based on few details, so treat this as a rough guide."}
            </p>
          </div>
        </div>

        <div className="r-bottom">
          <div className="r-next">
            <h3>What to do next</h3>
            <ol>
              <li>Show this report to a doctor. Only tests such as an angiogram can confirm narrowed arteries.</li>
              <li>Chest pain right now, or pain with sweating or breathlessness? Call emergency services.</li>
            </ol>
          </div>
          {qr && (
            <div className="r-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code to open the interactive results" />
              <span>Scan to open the interactive 3D heart</span>
            </div>
          )}
        </div>
        <Footer disclaimer={result.disclaimer} />
      </section>

      {/* ---------------- Page 2: why + for the doctor ---------------- */}
      <section className="r-page">
        <Header reportNo={reportNo} dateLabel={dateLabel} page={2} />

        <h2>Why this result</h2>
        {reasons.length ? (
          <ul className="r-reasons">
            {reasons.map((r) => (
              <li key={r.key}>
                <span className={`r-arrow ${r.up ? "up" : "down"}`}>{r.up ? "▲" : "▼"}</span>
                <span><b>{r.label}</b> ({r.value}) {r.up ? "raised" : "lowered"} the risk {strength(r.share)}.</span>
              </li>
            ))}
          </ul>
        ) : <p className="r-muted">None of the answers had a strong effect. The result mostly reflects typical values.</p>}

        <div className="r-cards">
          {ARTERIES.map((a) => (
            <div key={a.id} className="r-card">
              <h3><span className="r-dot" style={{ background: riskColorHex(P[a.id].probability) }} />{a.supplies} ({a.id})</h3>
              {plainReasons(P[a.id].explanation, 3).map((r) => (
                <p key={r.key}><span className={`r-arrow ${r.up ? "up" : "down"}`}>{r.up ? "▲" : "▼"}</span> {r.label}</p>
              ))}
            </div>
          ))}
        </div>

        <h2>For the doctor</h2>
        <table className="r-tech">
          <thead><tr><th>Target</th><th>Model</th><th>Probability</th><th>Cut-off</th><th>Top SHAP drivers (value, SHAP)</th></tr></thead>
          <tbody>
            {(["CAD", "LAD", "LCX", "RCA"] as Target[]).map((t) => (
              <tr key={t}>
                <td><b>{t === "CAD" ? "Overall CAD" : t}</b></td>
                <td>{MODEL_NAMES[P[t].model] ?? P[t].model}</td>
                <td>{pct(P[t].probability)}{P[t].predicted_positive ? " ●" : ""}</td>
                <td>{pct(P[t].threshold)}</td>
                <td className="r-drivers">
                  {P[t].explanation.slice(0, 3).map((e) => `${featureLabel(e.feature)} (${fmtValue(e.feature, e.value)}, ${e.contribution >= 0 ? "+" : ""}${e.contribution.toFixed(3)})`).join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="r-small">
          ● above the validated cut-off. Calibrated classifiers trained on the Z-Alizadeh Sani dataset (303 patients). The
          coronary findings (LAD/LCX/RCA/Cath) are never model inputs. SHAP values are in model units (probability for random
          forest, log-odds for logistic regression). {result.imputed_fields.length} inputs not provided were set to training medians.
        </p>

        <div className="r-disc">{result.disclaimer} Not a medical device. Predictions use clinical data, not imaging.</div>
        <div className="r-sign"><div>Reviewed by (name, signature)</div><div>Date</div></div>
        <Footer disclaimer="Coroscope · Multimodal AI Hackathon 2026 · Track A" />
      </section>
    </div>
  );
}
