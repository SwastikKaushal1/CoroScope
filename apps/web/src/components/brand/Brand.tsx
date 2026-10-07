import { HeartPulse } from 'lucide-react'

/** Shared Coroscope logo + wordmark. Used by the landing/form pages AND the results page so they match. */
export default function Brand({ onClick }: { onClick?: () => void }) {
  return <button type="button" onClick={onClick} aria-label="Return to Coroscope home" className="group flex items-center gap-3 transition-opacity hover:opacity-75"><div className="flex size-10 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/10"><HeartPulse className="size-5 text-teal-300" /></div><span className="text-sm font-semibold tracking-[0.2em] text-white">COROSCOPE</span></button>
}
