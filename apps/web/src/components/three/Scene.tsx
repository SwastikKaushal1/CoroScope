"use client";

import { Suspense } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Loader, OrbitControls } from "@react-three/drei";
import { useRiskStore } from "@/store/useRiskStore";
import Heart from "./Heart";

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

  return (
    // The canvas is transparent; this CSS gradient is the backdrop behind the heart.
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 42%, #1c2a44 0%, #0a1020 70%, #060912 100%)" }}
    >
      <Canvas
        shadows="soft" // soft-edged shadow maps
        dpr={[1, 1.75]} // cap pixel ratio: crisp on retina, still fast on integrated GPUs
        camera={{ position: [0, 0.1, 3.8], fov: 40, near: 0.1, far: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping; // filmic highlight roll-off
          gl.toneMappingExposure = 1.15;
        }}
        onPointerMissed={() => select(null)} // click on empty space = deselect
      >
                <ambientLight intensity={0.25} />

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
          <Lightformer form="ring" intensity={1} color="#ffd9cc" position={[0, -1, 5]} scale={4} />
        </Environment>

        <Suspense fallback={null}>
          <Heart />
        </Suspense>

        {/* Soft blurred shadow on an invisible floor under the heart. */}
        <ContactShadows position={[0, -1.25, 0]} opacity={0.5} blur={2.8} scale={5} far={2.2} color="#000010" />

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
          zoomSpeed={0.8}
          minDistance={2.2}
          maxDistance={7}
        />
      </Canvas>

      {/* Shows GLB download progress (the model is ~4 MB). */}
      <Loader />
    </div>
  );
}
