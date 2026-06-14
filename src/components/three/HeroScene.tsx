"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────
// The hero motif — a single, restrained "market surface".
//
// One quiet topographic lattice that breathes like a price field:
// warm-graphite wireframe lines dissolving into the page through fog.
// No orb, no emissive glow, no gradient soup — just precise depth.
// Honors prefers-reduced-motion by freezing into a calm static grid.
// ─────────────────────────────────────────────────────────────

const REDUCED =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Lattice() {
  const group = useRef<THREE.Group>(null);
  const geom = useMemo(() => new THREE.PlaneGeometry(38, 24, 56, 36), []);
  // Snapshot the flat base positions so we can re-derive height each frame.
  const base = useMemo(
    () => Float32Array.from(geom.attributes.position.array as Float32Array),
    [geom],
  );

  // A smooth sum-of-sines height field — deterministic, no noise lib.
  const heightAt = (x: number, y: number, t: number) =>
    Math.sin(x * 0.32 + t) * 0.62 +
    Math.cos(y * 0.4 + t * 0.8) * 0.5 +
    Math.sin((x + y) * 0.18 + t * 0.5) * 0.42;

  useFrame((state) => {
    if (!group.current) return;
    const t = REDUCED ? 0.6 : state.clock.elapsedTime * 0.32;
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, heightAt(base[i * 3], base[i * 3 + 1], t));
    }
    pos.needsUpdate = true;
    // Very slow drift for a faint sense of life (skipped when reduced).
    if (!REDUCED) group.current.rotation.z = Math.sin(t * 0.1) * 0.04;
  });

  return (
    <group ref={group} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1.6, 0]}>
      <mesh>
        <primitive object={geom} attach="geometry" />
        <meshBasicMaterial color="#4A433B" wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 2.4, 10.5], fov: 48 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={REDUCED ? "demand" : "always"}
    >
      <Suspense fallback={null}>
        {/* Fog matches the page background so the lattice dissolves at the edges. */}
        <fog attach="fog" args={["#0B0B0D", 9, 26]} />
        <Lattice />
      </Suspense>
    </Canvas>
  );
}
