"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, AdaptiveDpr } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { hashString, mulberry32 } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// The hero "3D website" centerpiece: a slowly rotating cloud of
// glowing candlestick bars + drifting ticker shards, evoking a
// living market. Pure procedural geometry — no external assets.
// ─────────────────────────────────────────────────────────────

function Candles({ count = 90 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const bars = useMemo(() => {
    const rand = mulberry32(hashString("mnemo-hero"));
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.3;
      const radius = 4 + rand() * 7;
      const height = 0.4 + rand() * 3.2;
      const up = rand() > 0.46;
      return {
        position: [
          Math.cos(angle) * radius,
          (rand() - 0.5) * 8,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        height,
        up,
        speed: 0.2 + rand() * 0.6,
        phase: rand() * Math.PI * 2,
      };
    });
  }, [count]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group ref={group}>
      {bars.map((b, i) => (
        <Float key={i} speed={b.speed} floatIntensity={0.6} rotationIntensity={0.2}>
          <mesh position={b.position}>
            <boxGeometry args={[0.22, b.height, 0.22]} />
            <meshStandardMaterial
              color={b.up ? "#16c784" : "#ea3943"}
              emissive={b.up ? "#0c7a4f" : "#8f1b22"}
              emissiveIntensity={0.6}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function CoreOrb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      const s = 1 + Math.sin(t * 1.2) * 0.04;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2.1, 2]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#0ea5e9"
        emissiveIntensity={0.8}
        roughness={0.15}
        metalness={0.6}
        wireframe
      />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 1.5, 16], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={["#05070f"]} />
        <fog attach="fog" args={["#05070f", 14, 34]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#7dd3fc" />
        <pointLight position={[-10, -6, -6]} intensity={0.7} color="#38bdf8" />
        <CoreOrb />
        <Candles />
        <Environment preset="night" />
        <AdaptiveDpr pixelated />
      </Suspense>
    </Canvas>
  );
}
