import Link from "next/link";
import type { Quote } from "@/lib/types";
import { clamp, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// SectorHeatmap — a 2D, Finviz-style market map. Each ticker is a tile
// tinted green/red by its daily % change (intensity ∝ |change|) and
// links to the symbol page. Clearer and faster than the 3D viz.
// Server-safe (no hooks).
// ─────────────────────────────────────────────────────────────

function tileBg(changePct: number): string {
  const alpha = clamp(0.1 + Math.abs(changePct) / 8, 0.1, 0.62);
  const rgb = changePct >= 0 ? "22, 199, 132" : "234, 57, 67";
  return `rgba(${rgb}, ${alpha.toFixed(3)})`;
}

export default function SectorHeatmap({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        No symbols in this region yet.
      </div>
    );
  }

  const tiles = [...quotes].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  return (
    <div className="grid grid-cols-3 gap-1.5 p-1.5 sm:grid-cols-4 md:grid-cols-6">
      {tiles.map((q) => (
        <Link
          key={q.symbol}
          href={`/markets/${q.symbol}`}
          style={{ backgroundColor: tileBg(q.changePct) }}
          className="flex flex-col items-center justify-center rounded-lg border border-line/40 px-1 py-3 text-center transition hover:border-brand/60"
        >
          <span className="truncate text-sm font-bold text-slate-100">{q.symbol}</span>
          <span className="font-mono text-xs text-slate-100/90">{fmtPct(q.changePct)}</span>
        </Link>
      ))}
    </div>
  );
}
