/** Brand mark: a heart with an ECG trace through it. Pure SVG, scales to any size. */
export default function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden>
      <rect width="40" height="40" rx="11" fill="#2563eb" />
      <path d="M20 31.5c-6.8-4.6-11-8.6-11-13.4 0-3.3 2.5-5.6 5.4-5.6 2.4 0 4.3 1.3 5.6 3.3 1.3-2 3.2-3.3 5.6-3.3 2.9 0 5.4 2.3 5.4 5.6 0 4.8-4.2 8.8-11 13.4Z" fill="#ffffff" />
      <path d="M9.5 20.5h6l2-4.5 3 8 2.2-5.5 1.3 2h6.5" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
