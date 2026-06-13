"use client";

import { useState } from "react";
import SectorHeatmap from "@/components/market/SectorHeatmap";
import SectorVizClient from "@/components/three/SectorVizClient";
import type { Quote } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// MarketMap — the market "map" with a 2D heatmap (default, clearer) and
// an optional 3D view. The heatmap reads at a glance; the 3D map is the
// cinematic option. Toggle in the corner.
// ─────────────────────────────────────────────────────────────

export default function MarketMap({ quotes }: { quotes: Quote[] }) {
  const [view, setView] = useState<"heatmap" | "3d">("heatmap");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-soft">
      <div className="absolute right-2 top-2 z-10 inline-flex rounded-lg border border-line bg-bg/80 p-0.5 backdrop-blur">
        {(["heatmap", "3d"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition",
              view === v ? "bg-bg-elevated text-slate-100" : "text-muted hover:text-slate-200",
            )}
          >
            {v === "heatmap" ? "Heatmap" : "3D"}
          </button>
        ))}
      </div>

      {view === "heatmap" ? (
        <div className="max-h-[420px] overflow-y-auto">
          <SectorHeatmap quotes={quotes} />
        </div>
      ) : (
        <div className="h-[420px]">
          <SectorVizClient quotes={quotes} />
        </div>
      )}
    </div>
  );
}
