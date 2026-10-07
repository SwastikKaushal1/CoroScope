"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { riskColorHex } from "@/lib/riskColor";

/* ------------------------------------------------------------------ *
 * HOW THE LABELS TRACK THE 3D MODEL
 *
 * 1. An invisible <group> sits at a point on the artery. Because it is a
 *    child of the heart group, it moves with the heart automatically.
 * 2. drei's <Html> reads that group's world matrix each frame and calls
 *    `calculatePosition` to get a pixel position for the HTML element.
 * 3. Our `calculatePosition` does the projection by hand:
 *        world point --camera.project()--> NDC (-1..1 on x and y)
 *        NDC --> pixels:  x = (ndc.x*0.5+0.5)*width
 *                         y = (-ndc.y*0.5+0.5)*height   (screen y points down)
 *    then CLAMPS the pixels so the pill can never be cut off by the canvas edge.
 * 4. A per-frame check fades the label out when its artery faces away from the
 *    camera (so labels never float over the back of the heart).
 *    The DOM is updated through a ref, NOT React state, so there are zero
 *    re-renders while the user orbits.
 * ------------------------------------------------------------------ */

// Pill geometry in CSS pixels. Keep in sync with the className below.
const PILL_H = 26; // pill height
const LIFT = 34; // distance from the artery point up to the pill centre
const STEM = LIFT - PILL_H / 2; // connector length from pill bottom to the artery point

// Clamp margins: how close the anchor may get to each canvas edge.
const MARGIN_X = 80; // half pill width + breathing room
const MARGIN_TOP = LIFT + PILL_H / 2 + 6; // the pill sits ABOVE the anchor, so it needs room on top
const MARGIN_BOTTOM = 14;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const _ndc = new THREE.Vector3(); // scratch vector, reused to avoid per-frame allocation

/** Project a 3D object to canvas pixels and keep the result inside the canvas. */
function projectAndClamp(
  obj: THREE.Object3D,
  camera: THREE.Camera,
  size: { width: number; height: number }
): [number, number] {
  _ndc.setFromMatrixPosition(obj.matrixWorld).project(camera);
  const x = (_ndc.x * 0.5 + 0.5) * size.width;
  const y = (-_ndc.y * 0.5 + 0.5) * size.height;
  return [
    clamp(x, MARGIN_X, size.width - MARGIN_X),
    clamp(y, MARGIN_TOP, size.height - MARGIN_BOTTOM),
  ];
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

interface Props {
  /** Artery point in heart-local space where the label is anchored. */
  anchor: THREE.Vector3;
  /** Short everyday name shown on the pill, e.g. "Front artery". */
  name: string;
  probability: number;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onHover: (over: boolean) => void;
}

export default function ArteryLabel({ anchor, name, probability, selected, hovered, onSelect, onHover }: Props) {
  const groupRef = useRef<THREE.Group>(null); // 3D anchor
  const pillRef = useRef<HTMLDivElement>(null); // DOM element we fade directly
  const world = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    const g = groupRef.current;
    const el = pillRef.current;
    if (!g || !el) return;

    g.getWorldPosition(world);
    // Outward surface normal ~ direction from the heart centre (origin) to the point.
    normal.copy(world).normalize();
    // Direction from the point to the camera.
    toCam.copy(camera.position).sub(world).normalize();
    // dot > 0 means the artery faces the camera; fade smoothly near the silhouette.
    const visibility = smoothstep(0.05, 0.35, normal.dot(toCam));

    el.style.opacity = visibility.toFixed(3);
    el.style.transform = `scale(${(0.88 + 0.12 * visibility).toFixed(3)})`;
    // Hidden labels must not steal clicks from the heart behind them.
    el.style.pointerEvents = visibility > 0.5 ? "auto" : "none";
  });

  const color = riskColorHex(probability);
  const active = selected || hovered;

  return (
    <group ref={groupRef} position={anchor}>
      <Html
        center
        calculatePosition={projectAndClamp}
        zIndexRange={[30, 0]}
        style={{ pointerEvents: "none" }} // the wrapper never blocks the canvas
      >
        {/* Outer div is positioned (-LIFT px) so the pill floats above the artery point. */}
        <div className="relative" style={{ top: -LIFT }}>
          <div
            ref={pillRef}
            role="button"
            tabIndex={-1}
            onClick={onSelect}
            onPointerEnter={() => onHover(true)}
            onPointerLeave={() => onHover(false)}
            className="relative flex cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[12px] font-semibold text-white shadow-lg backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200"
            style={{
              height: PILL_H,
              background: active ? "rgba(15,23,42,0.92)" : "rgba(15,23,42,0.72)",
              borderColor: active ? color : "rgba(255,255,255,0.18)",
              boxShadow: active ? `0 0 14px ${color}88` : "0 4px 14px rgba(0,0,0,0.35)",
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="tracking-wide">{name}</span>
            <span className="tabular-nums text-slate-300">{Math.round(probability * 100)}%</span>

            {/* Connector line + dot that point at the artery. */}
            <span
              className="pointer-events-none absolute left-1/2 top-full w-px -translate-x-1/2"
              style={{ height: STEM, background: `linear-gradient(${color}, transparent)` }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}
