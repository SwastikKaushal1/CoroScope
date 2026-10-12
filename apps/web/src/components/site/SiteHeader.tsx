import Link from "next/link";
import Brand from "@/components/brand/Brand";
import SafetyBanner from "@/components/brand/SafetyBanner";
import { FORM_ROUTE, HOME_ROUTE, MODEL_ROUTE } from "@/config/routes";

const NAV = [
  { href: `${HOME_ROUTE}#how`, label: "How it works" },
  { href: MODEL_ROUTE, label: "Accuracy" },
];

/** Safety notice + sticky top bar shared by every page except the report. */
export default function SiteHeader({ cta = true, right }: { cta?: boolean; right?: React.ReactNode }) {
  return (
    <>
      <SafetyBanner />
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={HOME_ROUTE} aria-label="Coroscope home"><Brand /></Link>
          <div className="flex items-center gap-6">
            <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
              {NAV.map((n) => <Link key={n.href} href={n.href} className="text-sm text-ink-2 transition hover:text-ink">{n.label}</Link>)}
            </nav>
            {right ?? (cta && <Link href={FORM_ROUTE} className="btn btn-primary h-10 px-5 text-sm">Check my heart</Link>)}
          </div>
        </div>
      </header>
    </>
  );
}
