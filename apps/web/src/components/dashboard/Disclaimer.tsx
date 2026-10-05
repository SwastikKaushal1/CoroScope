/** Persistent safety banner required by the challenge. Always rendered at the top. */
export default function Disclaimer() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-200 sm:text-sm"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
        <path d="M10 2 1 18h18L10 2Zm1 12H9v-2h2v2Zm0-3H9V7h2v4Z" />
      </svg>
      <span>
        <strong className="font-semibold">Decision support and educational use only.</strong> Not a substitute for
        formal diagnostic imaging or professional clinical judgement.
      </span>
    </div>
  );
}
