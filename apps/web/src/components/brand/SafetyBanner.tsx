import { Info } from "lucide-react";

/** Required clinical safety notice, shown at the top of every page. */
export default function SafetyBanner() {
  return (
    <div className="border-b border-line bg-sunken px-4 py-2 text-center text-[12px] text-ink-2">
      <Info className="mr-1.5 inline size-3.5 -translate-y-px text-heart" />
      For education and decision support only. Not a diagnosis and not a substitute for medical tests or a doctor.
    </div>
  );
}
