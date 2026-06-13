import type { ReputationTier } from "@/lib/types";
import { cn } from "@/lib/utils";
import { demoTrackRecord } from "@/lib/reputation";

// Small reputation chip: a colored dot + tier label, optional accuracy.
// Server-safe (no hooks). Pass a tier directly, or just a handle to
// derive a deterministic demo track record.
// brand-glow (#7dd3fc) is the design-system cyan used for the top tier.
const BRAND_GLOW = "#7dd3fc";
const TIER_DOT: Record<ReputationTier, string> = {
  Bronze: "#b08d57",
  Silver: "#c0c7d1",
  Gold: "#f5c451",
  "Top 1%": BRAND_GLOW,
  Rookie: "#7b8694",
};

export default function ReputationBadge({
  handle,
  tier,
  accuracy,
  size = "md",
}: {
  handle?: string;
  tier?: ReputationTier;
  accuracy?: number;
  size?: "sm" | "md";
}) {
  // Resolve tier/accuracy from the handle when not provided explicitly.
  let resolvedTier = tier;
  let resolvedAccuracy = accuracy;
  if ((resolvedTier == null || resolvedAccuracy == null) && handle) {
    const tr = demoTrackRecord(handle);
    resolvedTier = resolvedTier ?? tr.tier;
    resolvedAccuracy = resolvedAccuracy ?? tr.accuracy;
  }
  const finalTier: ReputationTier = resolvedTier ?? "Rookie";
  const dot = TIER_DOT[finalTier];
  const isSm = size === "sm";

  return (
    <span
      className={cn(
        "chip border-line bg-bg-soft text-slate-200",
        isSm ? "gap-1 px-2 py-0.5 text-[10px]" : "gap-1.5",
      )}
    >
      <span
        aria-hidden
        className="inline-block rounded-full"
        style={{
          width: isSm ? 6 : 8,
          height: isSm ? 6 : 8,
          background: dot,
          boxShadow: finalTier === "Top 1%" ? `0 0 6px ${BRAND_GLOW}` : undefined,
        }}
      />
      <span className="font-medium">{finalTier}</span>
      {resolvedAccuracy != null && (
        <span className="font-mono text-muted">{Math.round(resolvedAccuracy * 100)}%</span>
      )}
    </span>
  );
}
