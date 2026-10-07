"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";

const ARTERIES: { c: string; r: number; rot: [number, number, number]; arc: number }[] = [
  { c: "#e5484d", r: 1.25, rot: [0.4, 0.2, 0.3], arc: 4.2 }, // LAD
  { c: "#f5a524", r: 1.4, rot: [1.2, 0.8, 2.1], arc: 3.6 }, // LCX
  { c: "#2ecc9a", r: 1.55, rot: [2.3, 0.1, 4.0], arc: 3.2 }, // RCA
];

function Heart() {
  const g = useRef<Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    g.current.scale.setScalar(1 + Math.pow(Math.sin(t * 3), 8) * 0.07); // heartbeat
    g.current.rotation.y = t * 0.25;
  });
  return (
    <group ref={g}>
      <mesh>
        <icosahedronGeometry args={[1, 24]} />
        <MeshDistortMaterial color="#8b1e2d" distort={0.28} speed={1.5} roughness={0.35} metalness={0.2} />
      </mesh>
      {ARTERIES.map((a) => (
        <mesh key={a.c} rotation={a.rot}>
          <torusGeometry args={[a.r, 0.035, 12, 80, a.arc]} />
          <meshStandardMaterial color={a.c} emissive={a.c} emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={60} color="#7fb2ff" />
      <pointLight position={[-4, -2, 2]} intensity={40} color="#e5484d" />
      <Float speed={1.5} floatIntensity={0.8}><Heart /></Float>
      <Sparkles count={70} scale={8} size={2.5} speed={0.4} color="#7fb2ff" />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
