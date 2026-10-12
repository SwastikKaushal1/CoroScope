"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { ArteryDef } from "@/config/arteries";
import { riskColor } from "@/lib/riskColor";
import { useRiskStore } from "@/store/useRiskStore";
import { LabelAnchor } from "./Labels";
import { useProbabilityOverride } from "./ProbabilityOverride";

const VISIBLE_RADIUS = 0.026; // base radius of the drawn vessel (scene units)
const TAPER_START = 1.25; // vessels are thickest where they leave the aorta...
const TAPER_END = 0.45; // ...and thin out toward the tip, like real coronary arteries
const HIT_RADIUS = 0.055; // fatter invisible tube so thin vessels are easy to hover/click

/** TubeGeometry with a radius that shrinks along its length (scales each ring toward the centre line). */
function taperedTube(curve: THREE.CatmullRomCurve3, segs: number, radius: number, radial: number) {
  const g = new THREE.TubeGeometry(curve, segs, radius, radial, false);
  const pos = g.attributes.position;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, c);
    const k = TAPER_START + (TAPER_END - TAPER_START) * t;
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  pos.needsUpdate = true;
  return g;
}

const FLOW_DOTS = 7;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();

/**
 * Blood flow: small glowing cells travelling along the vessel. Flow slows as stenosis
 * probability rises (a narrowed artery carries less blood), so risk is visible as motion too.
 */
function BloodFlow({ curve, probability, dimmed }: { curve: THREE.CatmullRomCurve3; probability: number; dimmed: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const offsets = useMemo(() => Array.from({ length: FLOW_DOTS }, (_, i) => i / FLOW_DOTS), []);
  const phase = useRef(0);
  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    phase.current = (phase.current + delta * 0.2 * (1 - 0.8 * probability)) % 1;
    offsets.forEach((o, i) => {
      const t = (o + phase.current) % 1;
      curve.getPointAt(t, _p);
      const scale = Math.sin(Math.PI * t) * (1.25 - 0.8 * t); // fade in at the root, shrink toward the tip
      _m.makeScale(scale, scale, scale).setPosition(_p);
      mesh.setMatrixAt(i, _m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    (mesh.material as THREE.MeshBasicMaterial).opacity = dimmed ? 0.15 : 0.95;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, FLOW_DOTS]} renderOrder={2}>
      <sphereGeometry args={[0.017, 10, 8]} />
      <meshBasicMaterial color="#fff4f2" transparent depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}

/** Pulsing halo where a likely-narrowed vessel is labelled. Shown only above 50% probability. */
function Hotspot({ position, probability }: { position: THREE.Vector3; probability: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = (clock.elapsedTime * 0.9) % 1;
    m.scale.setScalar(1 + t * 1.6);
    (m.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.45 * probability;
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.04, 20, 14]} />
      <meshBasicMaterial color="#d7263d" transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

interface Props {
  def: ArteryDef;
  /** Curve already snapped onto the heart surface (see Heart.tsx). */
  curve: THREE.CatmullRomCurve3;
}

/**
 * One coronary vessel: a glossy tube, animated blood flow, a risk hotspot, an invisible
 * fat "hit" tube for the pointer, two rounded end caps and a label anchor (see Labels.tsx).
 *
 * React state vs. per-frame animation:
 *   - Probability / selected / hovered come from the Zustand store (React state).
 *   - The colour and glow are animated in useFrame by MUTATING the material.
 *     This gives smooth fades at 60fps without re-rendering React each frame.
 */
export default function Artery({ def, curve }: Props) {
  const stored = useRiskStore((s) => s.probabilities[def.id]);
  const override = useProbabilityOverride();
  const probability = override?.[def.id] ?? stored;
  const isSelected = useRiskStore((s) => s.selected === def.id);
  const isHovered = useRiskStore((s) => s.hovered === def.id);
  const dimmed = useRiskStore((s) => s.selected !== null && s.selected !== def.id); // another vessel is in focus
  const select = useRiskStore((s) => s.select);
  const hover = useRiskStore((s) => s.hover);

  // One material shared by the tube and its caps. Created once, disposed on unmount.
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#8a8f98", // starts grey, then fades to the risk colour on load
        emissive: "#8a8f98",
        emissiveIntensity: 0.15,
        roughness: 0.28,
        metalness: 0.05,
        clearcoat: 1, // wet, glossy vessel wall
        envMapIntensity: 1.3,
        clearcoatRoughness: 0.12,
        transparent: true,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  // Colour we are fading TOWARD; recomputed only when the probability changes.
  const target = useMemo(() => riskColor(probability), [probability]);

  // Geometry: TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  const tube = useMemo(() => taperedTube(curve, 140, VISIBLE_RADIUS, 20), [curve]);
  const hit = useMemo(() => new THREE.TubeGeometry(curve, 60, HIT_RADIUS, 8, false), [curve]);
  useEffect(() => () => { tube.dispose(); hit.dispose(); }, [tube, hit]);

  const start = useMemo(() => curve.getPoint(0), [curve]);
  const end = useMemo(() => curve.getPoint(1), [curve]);
  // Label anchor = a point along the vessel, nudged outward off the surface a hair.
  const anchor = useMemo(() => {
    const p = curve.getPoint(def.labelAt);
    return p.clone().addScaledVector(p.clone().normalize(), VISIBLE_RADIUS);
  }, [curve, def.labelAt]);

  // Runs every frame: exponential smoothing  v += (target - v) * k
  // where k = 1 - e^(-8*dt) makes the speed independent of frame rate.
  useFrame(({ clock }, delta) => {
    const k = 1 - Math.exp(-8 * delta);
    material.color.lerp(target, k);
    material.emissive.lerp(target, k);
    // High-risk vessels breathe with a slow glow so the eye is drawn to them first.
    const pulse = probability >= 0.65 ? 0.14 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.6)) : 0;
    const glow = dimmed ? 0.05 : (isSelected ? 0.75 : isHovered ? 0.5 : 0.18) + pulse;
    material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, glow, k);
    material.opacity = THREE.MathUtils.lerp(material.opacity, dimmed ? 0.35 : 1, k);
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation(); // only the nearest object reacts
    hover(def.id);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    hover(null);
    document.body.style.cursor = "auto";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); // don't let the click reach the heart / "pointer missed"
    select(isSelected ? null : def.id);
  };

  return (
    <group>
      <mesh geometry={tube} material={material} castShadow />
      {/* Rounded end caps so the tube doesn't look sliced off. */}
      <mesh material={material} position={start}>
        <sphereGeometry args={[VISIBLE_RADIUS * TAPER_START, 20, 14]} />
      </mesh>
      <mesh material={material} position={end}>
        <sphereGeometry args={[VISIBLE_RADIUS * TAPER_END, 16, 12]} />
      </mesh>

      <BloodFlow curve={curve} probability={probability} dimmed={dimmed} />
      {probability >= 0.5 && !dimmed && <Hotspot position={anchor} probability={probability} />}

      {/* Invisible fat copy: it only exists to receive pointer events. */}
      <mesh geometry={hit} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <LabelAnchor id={def.id} position={anchor} />
    </group>
  );
}
