"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Billboard } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Quote } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Interactive 3D market map: each stock is a bar whose height
// encodes |daily % change| and color encodes direction. Arranged
// on a grid the user can orbit. Driven by live (or mock) quotes.
// ─────────────────────────────────────────────────────────────

function Bar({
  quote,
  position,
}: {
  quote: Quote;
  position: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const target = Math.max(0.3, Math.min(6, Math.abs(quote.changePct) * 1.1));
  const up = quote.changePct >= 0;

  useFrame(() => {
    if (ref.current) {
      // Ease the bar height toward its target for a lively feel.
      const cur = ref.current.scale.y;
      const next = cur + (target - cur) * 0.08;
      ref.current.scale.y = next;
      ref.current.position.y = next / 2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref} position={[0, target / 2, 0]}>
        <boxGeometry args={[0.7, 1, 0.7]} />
        <meshStandardMaterial
          color={up ? "#16c784" : "#ea3943"}
          emissive={up ? "#0c7a4f" : "#8f1b22"}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      <Billboard position={[0, -0.6, 0]}>
        <Text fontSize={0.32} color="#cbd5e1" anchorX="center" anchorY="middle">
          {quote.symbol}
        </Text>
      </Billboard>
    </group>
  );
}

function Grid({ quotes }: { quotes: Quote[] }) {
  const group = useRef<THREE.Group>(null);
  const cols = Math.ceil(Math.sqrt(quotes.length));
  const spacing = 1.6;

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.12;
  });

  const placed = useMemo(() => {
    return quotes.map((q, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = (col - (cols - 1) / 2) * spacing;
      const z = (row - (Math.ceil(quotes.length / cols) - 1) / 2) * spacing;
      return { q, position: [x, 0, z] as [number, number, number] };
    });
  }, [quotes, cols]);

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[cols * spacing + 2, cols * spacing + 2]} />
        <meshStandardMaterial color="#0b1120" roughness={1} metalness={0} />
      </mesh>
      {placed.map(({ q, position }) => (
        <Bar key={q.symbol} quote={q} position={position} />
      ))}
    </group>
  );
}

export default function SectorViz({ quotes }: { quotes: Quote[] }) {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 8, 14], fov: 50 }}>
      <Suspense fallback={null}>
        <color attach="background" args={["#070b14"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[8, 12, 8]} intensity={1} color="#7dd3fc" />
        <directionalLight position={[-6, 10, -4]} intensity={0.5} />
        <Grid quotes={quotes} />
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={24}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Suspense>
    </Canvas>
  );
}
