import Link from "next/link";
import Footer from "@/components/web/Footer";

export default function NotFound() {
  return (
    <main>
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
        <svg viewBox="0 0 200 60" className="w-72" aria-hidden>
          <path d="M0 30h60l8-22 14 44 10-30 8 8h22" fill="none" stroke="#e5484d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ecg" />
          <path d="M132 30h68" stroke="#e5484d" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" opacity=".5" />
        </svg>
        <h1 className="font-display mt-6 text-7xl">404</h1>
        <p className="mt-3 text-lg text-slate-300">Flatline. This page has no pulse.</p>
        <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist or was moved.</p>
        <Link href="/" className="mt-8 rounded-full bg-teal-400 px-6 py-3 font-medium text-slate-950 hover:bg-teal-300">Back to home</Link>
      </div>
      <Footer />
    </main>
  );
}
