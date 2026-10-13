import Link from "next/link";
import Brand from "@/components/brand/Brand";
import { FORM_ROUTE, HOME_ROUTE, LEGAL_ROUTE, MODEL_ROUTE } from "@/config/routes";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1.3fr]">
        <div>
          <Brand />
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-2">Explainable AI that shows where coronary artery disease risk may be, on an interactive 3D heart.</p>
        </div>
        <nav className="flex flex-col gap-2.5 text-sm" aria-label="Footer">
          <Link href={FORM_ROUTE} className="text-ink-2 hover:text-ink">Check my heart</Link>
          <Link href={`${HOME_ROUTE}#how`} className="text-ink-2 hover:text-ink">How it works</Link>
          <Link href={MODEL_ROUTE} className="text-ink-2 hover:text-ink">Accuracy</Link>
          <Link href={LEGAL_ROUTE} className="text-ink-2 hover:text-ink">Privacy &amp; terms</Link>
        </nav>
        <p className="text-xs leading-5 text-ink-3">
          For education and decision support only. Not a diagnosis, and not a substitute for formal diagnostic imaging or a
          doctor&rsquo;s judgement. Models trained on the extended Z-Alizadeh Sani dataset (Mendeley Data, CC BY 4.0, 303 patients).
          <span className="mt-3 block">© 2026 Coroscope · Multimodal AI Hackathon 2026 · Track A</span>
        </p>
      </div>
    </footer>
  );
}
