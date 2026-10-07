import { CircleAlert } from 'lucide-react'

/** Shared safety banner (same on the landing, form and results pages). */
export default function SafetyBanner() { return <div className="border-b border-amber-300/10 bg-amber-300/[0.04] px-5 py-2.5 text-center text-[11px] text-slate-400"><CircleAlert className="mr-2 inline size-3.5 text-amber-300" />Decision support and educational use only. Not a substitute for formal diagnostic imaging.</div> }
