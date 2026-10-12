"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ARTERIES, type ArteryId } from "@/config/arteries";
import { riskColorHex } from "@/lib/riskColor";
import { useRiskStore, type Probabilities } from "@/store/useRiskStore";

/* ------------------------------------------------------------------ *
 * Artery labels as plain DOM, positioned from 3D every frame.
 *
 * Inside the <Canvas>, each artery registers an invisible anchor object.
 * <LabelProjector> projects the anchors to pixels each frame and writes
 * transform / opacity straight onto the pill elements rendered by
 * <LabelsOverlay> (outside the Canvas, in the normal React tree).
 * No drei <Html>, so no second React root and no re-renders while orbiting.
 * ------------------------------------------------------------------ */

export interface LabelRegistry {
  anchors: Map<ArteryId, THREE.Object3D>;
  pills: Map<ArteryId, HTMLElement>;
}
export const newRegistry = (): LabelRegistry => ({ anchors: new Map(), pills: new Map() });
export const LabelContext = createContext<LabelRegistry | null>(null);

const LIFT = 34; // px from the artery point up to the pill centre
const MARGIN_X = 70;
const MARGIN_TOP = 52;
const MARGIN_BOTTOM = 14;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Invisible 3D point that a label follows. Child of the heart, so it beats and rotates with it. */
export function LabelAnchor({ id, position }: { id: ArteryId; position: THREE.Vector3 }) {
  const reg = useContext(LabelContext);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!reg || !ref.current) return;
    reg.anchors.set(id, ref.current);
    return () => { reg.anchors.delete(id); };
  }, [reg, id]);
  return <group ref={ref} position={position} />;
}

/** Projects every anchor to canvas pixels each frame; fades labels on the far side of the heart. */
export function LabelProjector() {
  const reg = useContext(LabelContext);
  const size = useThree((s) => s.size);
  const world = useRef(new THREE.Vector3()).current;
  const ndc = useRef(new THREE.Vector3()).current;
  const toCam = useRef(new THREE.Vector3()).current;
  const normal = useRef(new THREE.Vector3()).current;
  useFrame(({ camera }) => {
    if (!reg) return;
    reg.anchors.forEach((obj, id) => {
      const el = reg.pills.get(id);
      if (!el) return;
      obj.getWorldPosition(world);
      ndc.copy(world).project(camera);
      const x = clamp((ndc.x * 0.5 + 0.5) * size.width, MARGIN_X, size.width - MARGIN_X);
      const y = clamp((-ndc.y * 0.5 + 0.5) * size.height, MARGIN_TOP, size.height - MARGIN_BOTTOM) - LIFT;
      toCam.copy(camera.position).sub(world).normalize();
      const visible = smoothstep(0.05, 0.35, normal.copy(world).normalize().dot(toCam));
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${(0.88 + 0.12 * visible).toFixed(3)})`;
      el.style.opacity = visible.toFixed(3);
      el.style.pointerEvents = visible > 0.5 ? "auto" : "none";
    });
  });
  return null;
}

/** The label pills themselves (DOM). Rendered over the canvas by <Scene>. */
export function LabelsOverlay({ registry, probabilities }: { registry: LabelRegistry; probabilities: Probabilities | null }) {
  const stored = useRiskStore((s) => s.probabilities);
  const selected = useRiskStore((s) => s.selected);
  const hovered = useRiskStore((s) => s.hovered);
  const select = useRiskStore((s) => s.select);
  const hover = useRiskStore((s) => s.hover);
  const probs = probabilities ?? stored;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ARTERIES.map((a) => {
        const p = probs[a.id];
        const color = riskColorHex(p);
        const active = selected === a.id || hovered === a.id;
        return (
          <button
            key={a.id}
            type="button"
            ref={(el) => { if (el) registry.pills.set(a.id, el); else registry.pills.delete(a.id); }}
            onClick={() => select(selected === a.id ? null : a.id)}
            onPointerEnter={() => hover(a.id)}
            onPointerLeave={() => hover(null)}
            style={{ opacity: 0, borderColor: active ? color : "rgba(15,23,42,0.12)", boxShadow: active ? `0 0 0 3px ${color}33, 0 6px 18px rgba(15,23,42,0.18)` : "0 4px 14px rgba(15,23,42,0.12)" }}
            className="absolute left-0 top-0 flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border bg-[#f8fafc]/95 px-2.5 text-[12px] font-semibold text-[#0f172a] backdrop-blur transition-[border-color,box-shadow] duration-200"
          >
            <span className="size-2 rounded-full" style={{ background: color }} />
            {a.plain}
            <span className="tabular-nums text-[#475569]">{Math.round(p * 100)}%</span>
            <span className="absolute left-1/2 top-full h-[21px] w-px -translate-x-1/2" style={{ background: `linear-gradient(${color}, transparent)` }} />
          </button>
        );
      })}
    </div>
  );
}
