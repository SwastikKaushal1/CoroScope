"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { ArteryDef } from "@/config/arteries";
import { riskColor } from "@/lib/riskColor";
import { useRiskStore } from "@/store/useRiskStore";
import ArteryLabel from "./ArteryLabel";

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

interface Props {
  def: ArteryDef;
  /** Curve already snapped onto the heart surface (see Heart.tsx). */
  curve: THREE.CatmullRomCurve3;
}

/**
 * One coronary vessel: a glossy tube, an invisible fat "hit" tube for the
 * pointer, two rounded end caps and a floating HTML label.
 *
 * React state vs. per-frame animation:
 *   - Probability / selected / hovered come from the Zustand store (React state).
 *   - The colour and glow are animated in useFrame by MUTATING the material.
 *     This gives smooth fades at 60fps without re-rendering React each frame.
 */
export default function Artery({ def, curve }: Props) {
  const probability = useRiskStore((s) => s.probabilities[def.id]);
  const isSelected = useRiskStore((s) => s.selected === def.id);
  const isHovered = useRiskStore((s) => s.hovered === def.id);
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
    const glow = (isSelected ? 0.75 : isHovered ? 0.5 : 0.18) + pulse;
    material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, glow, k);
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

      {/* Invisible fat copy: it only exists to receive pointer events. */}
      <mesh geometry={hit} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <ArteryLabel
        anchor={anchor}
        name={def.plain}
        probability={probability}
        selected={isSelected}
        hovered={isHovered}
        onSelect={() => select(isSelected ? null : def.id)}
        onHover={(over) => hover(over ? def.id : null)}
      />
    </group>
  );
}
