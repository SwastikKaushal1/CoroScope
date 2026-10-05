"use client";

import dynamic from "next/dynamic";
import Disclaimer from "@/components/dashboard/Disclaimer";
import RiskPanel from "@/components/dashboard/RiskPanel";

// three.js needs WebGL, which only exists in the browser, so the canvas is
// loaded client-side only (ssr: false) and never rendered on the server.
const Scene = dynamic(() => import("@/components/three/Scene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading 3D view…</div>,
});

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <Disclaimer />
      {/* Mobile: canvas stacked above the panel. Desktop (lg): canvas left, 340px panel right. */}
      <main className="grid min-h-0 flex-1 grid-rows-[minmax(320px,1fr)_auto] lg:grid-cols-[1fr_340px] lg:grid-rows-1">
        <section className="relative min-h-0">
          <Scene />
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
            Drag to rotate · Scroll to zoom · Click a vessel
          </p>
        </section>
        <RiskPanel />
      </main>
    </div>
  );
}
