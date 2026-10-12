import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <SiteHeader />
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <svg viewBox="0 0 200 60" className="w-72" aria-hidden>
          <path d="M0 30h60l8-22 14 44 10-30 8 8h22" fill="none" stroke="#e5484d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ecg" />
          <path d="M132 30h68" stroke="#e5484d" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" opacity=".5" />
        </svg>
        <h1 className="font-display mt-6 text-7xl">404</h1>
        <p className="mt-3 text-lg text-ink-2">Flatline. This page has no pulse.</p>
        <p className="mt-1 text-sm text-ink-3">The page you are looking for does not exist or was moved.</p>
        <Link href="/" className="mt-8 rounded-xl bg-navy px-6 py-3 font-semibold text-white hover:bg-navy-2">Back to home</Link>
      </div>
      <SiteFooter />
    </main>
  );
}
