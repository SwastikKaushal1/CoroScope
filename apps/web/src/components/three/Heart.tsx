"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ARTERIES } from "@/config/arteries";
import Artery from "./Artery";

const MODEL_URL = "/models/heart.glb";
const LIFT = 0.012; // how far vessels sit above the surface (scene units)
const SAMPLES = 60; // points per vessel after snapping to the surface

// Developer tool: when true, clicking the heart logs local coordinates you can
// paste into config/arteries.ts. The heartbeat is paused while it is on.
const DEBUG_PICK = false;

/**
 * The GLB has no normals, and its vertices are duplicated along texture seams.
 * Plain computeVertexNormals() would leave a visible crease on every seam, so after
 * computing we average the normals of vertices that sit at the same position.
 */
function smoothNormals(geo: THREE.BufferGeometry) {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const groups = new Map<string, number[]>();
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
    const g = groups.get(k);
    if (g) g.push(i);
    else groups.set(k, [i]);
  }
  const v = new THREE.Vector3();
  groups.forEach((ids) => {
    if (ids.length < 2) return;
    v.set(0, 0, 0);
    ids.forEach((i) => (v.x += nor.getX(i)));
    ids.forEach((i) => (v.y += nor.getY(i)));
    ids.forEach((i) => (v.z += nor.getZ(i)));
    v.normalize();
    ids.forEach((i) => nor.setXYZ(i, v.x, v.y, v.z));
  });
  nor.needsUpdate = true;
}

export default function Heart({ targetHeight = 2 }: { targetHeight?: number }) {
  const { scene } = useGLTF(MODEL_URL);
  // useGLTF caches one scene; clone so this component owns its own graph.
  const model = useMemo(() => scene.clone(true), [scene]);
  const rootRef = useRef<THREE.Group>(null);

  /* ---- 1. Normalise size and position -------------------------------
   * Models come in arbitrary units. Measure the bounding box, then
   *   scale  = desiredHeight / currentHeight
   *   offset = -centre   (moves the box centre to the origin)
   * Scale is applied by a parent <group>, offset by the <primitive>, which
   * means: world = (local + offset) * scale. The probe below repeats the
   * exact same transform so vessel curves line up with what is drawn.
   */
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { scale: targetHeight / (size.y || 1), offset: center.multiplyScalar(-1) };
  }, [model, targetHeight]);

  /* ---- 2. Realistic material ---------------------------------------
   * The GLB ships with metallic=1 / roughness=1 (looks like dull metal).
   * We keep ITS colour texture but swap in a physically based material:
   * non-metal, moderately glossy, plus a clearcoat layer (wet tissue look)
   * and sheen (soft rim glow typical of organic surfaces).
   */
  const material = useMemo(() => {
    let map: THREE.Texture | null = null;
    let normalMap: THREE.Texture | null = null;
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const src = m.material as THREE.MeshStandardMaterial;
      if (!map) map = src.map ?? null;
      if (!normalMap) normalMap = src.normalMap ?? null; // the fine muscle / fat detail lives here
    });
    return new THREE.MeshPhysicalMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(1.25, 1.25),
      color: map ? "#ffffff" : "#c98f8a",
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.7, // wet, living tissue
      clearcoatRoughness: 0.22,
      sheen: 0.6,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color("#ff7f8c"),
      envMapIntensity: 1.1,
      side: THREE.DoubleSide, // scanned meshes often have open/inverted faces
    });
  }, [model]);
  useEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      // The file has no normals; without them lighting would be flat/black.
      if (!m.geometry.attributes.normal) smoothNormals(m.geometry);
      m.material = material;
      m.castShadow = true; // heart shadows itself and the vessels' shadows land on it
      m.receiveShadow = true;
    });
  }, [model, material]);

  /* ---- 3. Build vessel curves that hug the surface -------------------
   * a) Smooth the hand-placed waypoints with a Catmull-Rom spline.
   * b) For each of SAMPLES points, shoot a ray from outside the heart toward
   *    the centre (direction = -normalize(point)); the first hit is the surface.
   * c) Lift the hit slightly along the radial direction so the tube sits ON TOP.
   * d) Join the snapped points into the final curve.
   * Raycasting uses a throw-away copy of the model so we never touch what renders.
   */
  const curves = useMemo(() => {
    const probeRoot = new THREE.Group();
    const probeModel = model.clone(true);
    probeModel.position.copy(offset);
    probeRoot.scale.setScalar(scale);
    probeRoot.add(probeModel);
    probeRoot.updateMatrixWorld(true); // raycasting needs up-to-date world matrices

    const meshes: THREE.Mesh[] = [];
    probeModel.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); // hit back faces too
        meshes.push(m);
      }
    });

    const ray = new THREE.Raycaster();
    return ARTERIES.map((def) => {
      const rough = new THREE.CatmullRomCurve3(def.waypoints.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
      const snapped: THREE.Vector3[] = [];
      for (let i = 0; i < SAMPLES; i++) {
        const p = rough.getPoint(i / (SAMPLES - 1));
        const dir = p.clone().normalize(); // radial "outward" direction
        ray.set(p.clone().addScaledVector(dir, 1.5), dir.clone().negate());
        const hit = ray.intersectObjects(meshes, false)[0];
        snapped.push(hit ? hit.point.clone().addScaledVector(dir, LIFT) : p);
      }
      return { def, curve: new THREE.CatmullRomCurve3(snapped) };
    });
  }, [model, offset, scale]);

  /* ---- 4. Heartbeat --------------------------------------------------
   * Two Gaussian bumps per cycle ("lub-dub") scale the WHOLE group by ~1.8%.
   * Vessels and labels are children, so they beat with the heart and stay glued to it.
   */
  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root || DEBUG_PICK) return;
    const phase = (clock.elapsedTime * 1.1) % 1; // ~66 bpm
    const bump = (c: number, w: number) => Math.exp(-(((phase - c) / w) ** 2));
    const beat = 0.65 * bump(0.08, 0.05) + 0.35 * bump(0.28, 0.06);
    root.scale.setScalar(1 + 0.022 * beat);
    // A slow, gentle float so the heart feels alive even when nobody is touching it.
    root.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.018;
  });

  const onPick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const p = rootRef.current!.worldToLocal(e.point.clone());
    console.log(`[${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}],`);
  };

  return (
    <group ref={rootRef}>
      <group scale={scale}>
        <primitive object={model} position={offset} onClick={DEBUG_PICK ? onPick : undefined} />
      </group>
      {curves.map(({ def, curve }) => (
        <Artery key={def.id} def={def} curve={curve} />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_URL);
