import type { FeatureDef } from "@/config/features";
import { inRange } from "@/lib/form";

/** Shared input controls for the quick check and the clinical form. "" always means "unknown". */
export const fieldLabel = "text-xs font-medium uppercase tracking-[0.12em] text-ink-2";
export const inputBox =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink-3 focus:border-navy focus:ring-2 focus:ring-navy/15";

type Option = { value: string; label: string };

export function Segmented({ value, onChange, options, label, size = "sm" }: { value: string; onChange: (v: string) => void; options: Option[]; label: string; size?: "sm" | "lg" }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`min-w-14 flex-1 rounded-lg font-medium transition ${size === "lg" ? "px-3 py-2.5 text-sm" : "px-2.5 py-2 text-xs"} ${value === o.value ? (o.value === "" ? "bg-line text-ink" : "bg-navy text-white") : "text-ink-2 hover:bg-sunken hover:text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const YES_NO_UNKNOWN: Option[] = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "", label: "Not sure" }];

export function NumberInput({ def, value, onChange, median, id, placeholder }: { def: FeatureDef; value: string; onChange: (v: string) => void; median?: number; id: string; placeholder?: string }) {
  const bad = value.trim() !== "" && !inRange(def, value);
  const unitWord: Record<string, string> = { cm: "centimetres", kg: "kilograms", yr: "years" };
  return (
    <div>
      <div className="relative">
        <input id={id} type="number" inputMode="decimal" step={def.step ?? 1} min={def.min} max={def.max} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? (median !== undefined ? `typical ${+median.toFixed(1)}` : "unknown")}
          aria-invalid={bad} aria-describedby={bad ? `${id}-err` : undefined}
          className={`${inputBox} pr-20 ${bad ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/20" : ""}`} />
        {def.unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-3">{def.unit}</span>}
      </div>
      {bad && (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-bad">
          Please check: {def.label.toLowerCase()} is in {unitWord[def.unit ?? ""] ?? def.unit ?? "these units"} ({def.min}–{def.max}{def.unit ? ` ${def.unit}` : ""}). This value won&rsquo;t be used.
        </p>
      )}
    </div>
  );
}

/** One catalog feature rendered with the control that fits its kind. */
export function Field({ def, value, onChange, median }: { def: FeatureDef; value: string; onChange: (v: string) => void; median?: number }) {
  const id = `f-${def.key.replace(/\W/g, "")}`;
  const unknown = { value: "", label: "Unknown" };
  let control;
  if (def.kind === "number") {
    control = <NumberInput id={id} def={def} value={value} onChange={onChange} median={median} />;
  } else if (def.kind === "yesno") {
    control = <Segmented label={def.label} value={value} onChange={onChange} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, unknown]} />;
  } else if (def.kind === "sex") {
    control = <Segmented label={def.label} value={value} onChange={onChange} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, unknown]} />;
  } else {
    control = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputBox}>
        <option value="">Unknown</option>
        {def.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={def.kind === "number" || def.kind === "select" ? id : undefined} className={fieldLabel}>{def.label}</label>
      {control}
      {(def.normal || def.hint) && <p className="text-xs leading-5 text-ink-3">{def.hint ?? `Normal ${def.normal} ${def.unit ?? ""}`}</p>}
    </div>
  );
}
