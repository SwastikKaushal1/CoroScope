import Link from "next/link";
import Logo from "@/components/brand/Logo";
import { BRAND } from "@/config/brand";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/30 px-6 py-10 text-sm text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-slate-200"><Logo size={24} /><span className="font-display text-lg">{BRAND}</span></div>
          <p className="mt-3 max-w-xs">Interactive 3D coronary risk visualization with explainable machine learning.</p>
        </div>
        <nav className="flex flex-col gap-2" aria-label="Footer">
          <Link href="/assess" className="hover:text-white">Start assessment</Link>
          <Link href="/#how" className="hover:text-white">How it works</Link>
          <Link href="/results?demo" className="hover:text-white">Demo results</Link>
        </nav>
        <p className="text-xs leading-relaxed text-amber-200/80">
          Decision support and educational use only. Not a substitute for formal diagnostic imaging or professional clinical judgement. Trained on the Z-Alizadeh Sani dataset (303 patients).
        </p>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-slate-500">© {new Date().getFullYear()} {BRAND} · Multimodal AI Hackathon 2026 · Track A</p>
    </footer>
  );
}
