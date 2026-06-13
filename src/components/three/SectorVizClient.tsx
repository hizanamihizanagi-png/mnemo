"use client";

import dynamic from "next/dynamic";
import type { Quote } from "@/lib/types";

const SectorViz = dynamic(() => import("./SectorViz"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-bg-soft text-sm text-muted">
      Loading 3D market map…
    </div>
  ),
});

export default function SectorVizClient({ quotes }: { quotes: Quote[] }) {
  return <SectorViz quotes={quotes} />;
}
