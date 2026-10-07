/** Brand mark (ECG line through a target ring, red dot = the lesion). Pure SVG, scales to any size. */
export default function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <circle cx="32" cy="32" r="27" fill="#0B1B2B" />
      <circle cx="32" cy="32" r="27" fill="none" stroke="#0E8F8A" strokeWidth="3" />
      <path d="M32 2v8M32 54v8M2 32h8M54 32h8" stroke="#0E8F8A" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 34h10l5-13 8 25 5-12h12" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="47" cy="34" r="3.4" fill="#E5484D" />
    </svg>
  );
}
