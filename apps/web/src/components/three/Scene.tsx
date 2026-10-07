"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Loader, OrbitControls } from "@react-three/drei";
import { useRiskStore } from "@/store/useRiskStore";
import { ARTERIES } from "@/config/arteries";
import { registerCapture } from "@/lib/snapshot";
import Heart from "./Heart";

/**
 * Renders nothing. Registers a function that photographs the current 3D view
 * (same angle the user is looking at) for the PDF report. The transparent canvas is
 * composited onto the same dark gradient as the on-screen backdrop and downscaled.
 */
function CaptureBridge() {
  const { gl, scene, camera } = useThree();
  useEffect(
    () =>
      registerCapture(() => {
        gl.render(scene, camera); // render right before reading, so the buffer is not blank
        const src = gl.domElement;
        const k = Math.min(1, 900 / src.width);
        const w = Math.round(src.width * k);
        const h = Math.round(src.height * k);
        const out = document.createElement("canvas");
        out.width = w;
        out.height = h;
        const ctx = out.getContext("2d");
        if (!ctx) return null;
        const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.7);
        g.addColorStop(0, "#1c2a44");
        g.addColorStop(0.7, "#0a1020");
        g.addColorStop(1, "#060912");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(src, 0, 0, w, h);
        return out.toDataURL("image/jpeg", 0.88);
      }),
    [gl, scene, camera]
  );
  return null;
}

/**
 * Renders nothing. When a vessel is selected, swings the camera round (about the vertical
 * axis, same distance and height) so that vessel faces the viewer. Stops the moment the
 * user grabs the heart themselves.
 */
function CameraRig() {
  const selected = useRiskStore((s) => s.selected);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as (THREE.EventDispatcher & { update: () => void }) | null;
  const goal = useRef<number | null>(null);

  useEffect(() => {
    const def = ARTERIES.find((a) => a.id === selected);
    if (!def) {
      goal.current = null;
      return;
    }
    const [x, , z] = def.waypoints[Math.floor(def.waypoints.length / 2)];
    // Camera angle around Y (0 = straight in front). Clamp so we never swing round the back.
    goal.current = THREE.MathUtils.clamp(Math.atan2(x, z), -1.1, 1.1);
  }, [selected]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => (goal.current = null);
    controls.addEventListener("start" as never, stop);
    return () => controls.removeEventListener("start" as never, stop);
  }, [controls]);

  useFrame((_, delta) => {
    if (goal.current === null) return;
    const cur = Math.atan2(camera.position.x, camera.position.z);
    let d = goal.current - cur;
    d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest way round
    if (Math.abs(d) < 0.004) {
      goal.current = null;
      return;
    }
    const a = d * (1 - Math.exp(-4 * delta));
    const { x, z } = camera.position;
    camera.position.x = x * Math.cos(a) + z * Math.sin(a);
    camera.position.z = z * Math.cos(a) - x * Math.sin(a);
    camera.lookAt(0, 0, 0);
    controls?.update();
  });
  return null;
}

/**
 * The 3D stage: renderer settings, lights, reflections, ground shadow, camera.
 *
 * Lighting recipe (classic 3-point + image-based light):
 *   key  - warm, strong, from front-top-right; the ONLY light that casts shadows
 *   fill - cool, weak, from the opposite side so shadows aren't pitch black
 *   rim  - from behind; traces the silhouette and separates heart from background
 *   env  - procedural studio "softboxes" that give the glossy surface
 *          something to reflect. Built from Lightformers, so no HDR download.
 */
export default function Scene() {
  const select = useRiskStore((s) => s.select);
  const selected = useRiskStore((s) => s.selected);
  const [touched, setTouched] = useState(false); // once the user grabs the heart, stop the slow idle turn

  return (
    // The canvas is transparent; this CSS gradient is the backdrop behind the heart.
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 42%, #1c2a44 0%, #0a1020 70%, #060912 100%)" }}
    >
      <Canvas
        shadows="soft" // soft-edged shadow maps
        dpr={[1, 1.75]} // cap pixel ratio: crisp on retina, still fast on integrated GPUs
        camera={{ position: [0.9, 0.15, 3.7], fov: 38, near: 0.1, far: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping; // filmic highlight roll-off
          gl.toneMappingExposure = 1.2;
        }}
        onPointerMissed={() => select(null)} // click on empty space = deselect
      >
        <CaptureBridge />
        <CameraRig />
        <ambientLight intensity={0.3} />

        {/* KEY light + shadow settings */}
        <directionalLight
          position={[3, 4, 5]}
          intensity={2.4}
          color="#fff1e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={14}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}
          shadow-bias={-0.0004} // small negative bias prevents "shadow acne" speckles
          shadow-normalBias={0.02}
        />
        {/* FILL light */}
        <directionalLight position={[-4, 1, 3]} intensity={0.55} color="#9db8ff" />
        {/* RIM light */}
        <directionalLight position={[0, 3, -5]} intensity={1.6} color="#7fb2ff" />

        {/* Procedural studio environment used for reflections only. */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.5} position={[0, 4, 3]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
          <Lightformer form="rect" intensity={1.6} position={[5, 0, -2]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
          <Lightformer form="ring" intensity={1.2} color="#ffd9cc" position={[0, -1, 5]} scale={4} />
          <Lightformer form="circle" intensity={1.4} color="#ffe9dd" position={[3, 2, 4]} scale={2} />
        </Environment>

        <Suspense fallback={null}>
          <Heart />
        </Suspense>

        {/* Soft blurred shadow on an invisible floor under the heart. */}
        <ContactShadows position={[0, -1.25, 0]} opacity={0.5} blur={2.8} scale={5} far={2.2} color="#000010" />

        <OrbitControls
          makeDefault
          onStart={() => setTouched(true)}
          autoRotate={!touched && selected === null}
          autoRotateSpeed={0.7}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
          zoomSpeed={0.8}
          minDistance={2.2}
          maxDistance={7}
        />
      </Canvas>

      {/* Shows download progress while the heart loads (about 4 MB). */}
      <Loader />
    </div>
  );
}
