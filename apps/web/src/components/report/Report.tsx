"use client";

import { ARTERIES } from "@/config/arteries";
import { BRAND } from "@/config/brand";
import { featureLabel, fmtValue } from "@/lib/format";
import { riskColorHex } from "@/lib/riskColor";
import type { Patient, PredictionResponse, Target } from "@/lib/types";
import Logo from "@/components/brand/Logo";
import "./report.css";

const pct = (p: number) => `${Math.round(p * 100)}%`;
const dash = (s: string) => s.trim() || "-";

/** Fallback picture when no 3D snapshot exists (e.g. page opened directly). */
function Schematic({ r }: { r: PredictionResponse }) {
  const c = (k: "LAD" | "LCX" | "RCA") => riskColorHex(r.predictions[k].probability);
  return (
    <svg viewBox="0 0 200 190" role="img" aria-label="Schematic of coronary arteries coloured by predicted risk">
      <path d="M100 172C40 128 18 94 18 62 18 36 38 22 60 22 78 22 92 32 100 46 108 32 122 22 140 22 162 22 182 36 182 62 182 94 160 128 100 172Z" fill="#FBEAEA" stroke="#C9A3A3" strokeWidth="2" />
      <g fill="none" strokeWidth="8" strokeLinecap="round">
        <path d="M100 42C96 80 88 105 84 140" stroke={c("LAD")} />
        <path d="M97 44C70 50 44 66 38 102" stroke={c("LCX")} />
        <path d="M104 44C140 44 166 62 161 100 159 116 151 128 141 140" stroke={c("RCA")} />
      </g>
      <g fontFamily="Segoe UI,Arial" fontSize="12" fontWeight="700" fill="#12263A">
        <text x="88" y="156">LAD</text><text x="14" y="118">LCX</text><text x="150" y="156">RCA</text>
      </g>
      <text x="100" y="186" textAnchor="middle" fontSize="9" fill="#5B6B7B" fontFamily="Segoe UI,Arial">Schematic, not anatomical</text>
    </svg>
  );
}

/** Top-5 factor bars for one target. Hatched = value not entered (model estimated it). */
function Factors({ r, t }: { r: PredictionResponse; t: Target }) {
  return (
    <>
      {r.predictions[t].explanation.slice(0, 5).map((f) => {
        const est = f.value === null;
        const up = f.contribution >= 0;
        return (
          <div key={f.feature} className={`rpt-f ${est ? "est" : ""}`} style={{ ["--c" as string]: up ? "#D64545" : "#2E9E6B" }}>
            <div>
              {featureLabel(f.feature)} <small>{est ? "estimated" : `= ${fmtValue(f.feature, f.value)}`}</small>
            </div>
            <div className="rpt-bar" title={up ? "raises risk" : "lowers risk"}>
              <i style={{ width: `${Math.min(100, f.share_pct * 2.5)}%` }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

/**
 * The printable report. Pure presentation: give it the API response, the patient
 * header and (optionally) the 3D snapshot. Printing is handled by the page (window.print()).
 */
export default function Report({
  result, patient, snapshot, reportNo, dateLabel,
}: { result: PredictionResponse; patient: Patient; snapshot: string | null; reportNo: string; dateLabel: string }) {
  const P = result.predictions;
  const cad = P.CAD;
  const cadColor = riskColorHex(cad.probability);
  const top = ARTERIES.map((a) => a.id).sort((a, b) => P[b].probability - P[a].probability)[0];
  const topDef = ARTERIES.find((a) => a.id === top)!;
  const entered = new Set<string>();
  Object.values(P).forEach((p) => p.explanation.forEach((e) => e.value !== null && entered.add(e.feature)));

  const summary = cad.predicted_positive
    ? `The assessment suggests coronary artery disease. The ${topDef.plain.toLowerCase()} (${top}) shows the highest risk at ${pct(P[top].probability)}.`
    : `The assessment does not suggest coronary artery disease. The highest risk is in the ${topDef.plain.toLowerCase()} (${top}) at ${pct(P[top].probability)}.`;

  return (
    <article className="rpt" id="report">
      <div className="rpt-head">
        <Logo size={48} />
        <div>
          <h1>Coronary Risk Assessment</h1>
          <small>{BRAND} heart health report</small>
        </div>
        <div className="rpt-meta">Report no. {reportNo}<br />{dateLabel}</div>
      </div>

      <section className="rpt-sec">
        <h2>Patient details</h2>
        <table className="rpt-kv"><tbody>
          <tr><td>Name</td><td>{dash(patient.name)}</td><td>Patient ID</td><td>{dash(patient.id)}</td></tr>
          <tr><td>Age</td><td>{dash(patient.age)}</td><td>Sex</td><td>{dash(patient.sex)}</td></tr>
          <tr><td>Doctor</td><td>{dash(patient.doctor)}</td><td>Details recorded</td><td>{entered.size}</td></tr>
        </tbody></table>
      </section>

      <section className="rpt-sec">
        <h2>Assessment</h2>
        <div className="rpt-verdict" style={{ ["--c" as string]: cadColor }}>
          <div className="rpt-big">{pct(cad.probability)}</div>
          <div>
            <b>{cad.predicted_positive ? "Coronary artery disease likely" : "Coronary artery disease not predicted"}</b>{" "}
            <span className="rpt-pill">{cad.risk_level} risk</span>
            <div className="rpt-note" style={{ margin: "2px 0 0" }}>{summary}</div>
          </div>
        </div>
      </section>

      <section className="rpt-sec">
        <h2>Your heart arteries</h2>
        <div className="rpt-two">
          <figure className="rpt-fig">
            {snapshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <><img src={snapshot} alt="3D view of the heart with arteries coloured by predicted risk" /><figcaption>3D view, coloured by predicted risk</figcaption></>
            ) : (
              <Schematic r={result} />
            )}
          </figure>
          <table className="rpt-v">
            <thead><tr><th>Artery</th><th>Part of the heart it feeds</th><th>Risk</th><th></th><th>Level</th></tr></thead>
            <tbody>
              {ARTERIES.map((a) => {
                const p = P[a.id];
                return (
                  <tr key={a.id} style={{ ["--c" as string]: riskColorHex(p.probability) }}>
                    <td><b>{a.plain}</b><br /><small>{a.label} ({a.id})</small></td>
                    <td>{a.supplies}</td>
                    <td style={{ width: "26%" }}><div className="rpt-bar"><i style={{ width: pct(p.probability) }} /></div></td>
                    <td><b>{pct(p.probability)}</b></td>
                    <td><span className="rpt-pill">{p.risk_level}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="rpt-note">Chance that each artery is narrowed by half or more.</p>
      </section>

      <section className="rpt-sec">
        <h2>What influenced this result</h2>
        <div className="rpt-cards">
          {(["CAD", ...ARTERIES.map((a) => a.id)] as Target[]).map((t) => (
            <div className="rpt-card" key={t}>
              <h3>{t === "CAD" ? "Overall CAD" : ARTERIES.find((a) => a.id === t)!.plain}</h3>
              <Factors r={result} t={t} />
            </div>
          ))}
        </div>
        <p className="rpt-note">
          Longer bars mean a bigger effect; red raises risk and green lowers it. Faded rows were not available, so a
          typical value was used. {result.imputed_fields.length} details were not provided.
        </p>
      </section>

      <div className="rpt-disc">{result.disclaimer}</div>
      <div className="rpt-sign"><div>Reviewed by (name and signature)</div><div>Date</div></div>
      <div className="rpt-foot"><span>{BRAND}</span><span>For guidance only, not a diagnosis</span></div>
    </article>
  );
}
