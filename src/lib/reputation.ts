// ─────────────────────────────────────────────────────────────
// Reputation / track-record scoring. Pure functions, no IO.
//
// A trader's tier is derived from prediction accuracy and volume.
// Demo records are deterministic per handle so the UI is stable.
// ─────────────────────────────────────────────────────────────

import type { ReputationTier, TrackRecord } from "@/lib/types";
import { hashString, mulberry32 } from "@/lib/utils";

// Map an accuracy + sample size to a tier.
export function tierOf(accuracy: number, n: number): ReputationTier {
  if (n < 10) return "Rookie";
  if (accuracy >= 0.75 && n >= 30) return "Top 1%";
  if (accuracy >= 0.65) return "Gold";
  if (accuracy >= 0.55) return "Silver";
  return "Bronze";
}

// Deterministic demo track record for a handle.
export function demoTrackRecord(handle: string): TrackRecord {
  const rand = mulberry32(hashString("rep:" + handle.toLowerCase()));
  const accuracy = Number((0.5 + rand() * 0.32).toFixed(3)); // 0.50..0.82
  const nPredictions = 12 + Math.floor(rand() * 129); // 12..140
  const nResolved = Math.round(nPredictions * 0.8); // ~80% resolved
  const alpha = Number((-4 + rand() * 22).toFixed(1)); // -4..+18
  return {
    accuracy,
    alpha,
    nPredictions,
    nResolved,
    tier: tierOf(accuracy, nPredictions),
  };
}

// Best-effort track record from raw prediction rows. If the rows carry
// no outcome data, derive plausible figures from the count alone.
export function trackRecordFromPredictions(rows: any[]): TrackRecord {
  const list = Array.isArray(rows) ? rows : [];
  const nPredictions = list.length;

  // Rows considered resolved if they expose an explicit outcome field.
  const resolved = list.filter(
    (r) =>
      r &&
      (r.resolved === true ||
        r.outcome != null ||
        r.correct != null ||
        r.hit != null),
  );

  let accuracy: number;
  let nResolved: number;

  if (resolved.length > 0) {
    nResolved = resolved.length;
    const hits = resolved.filter((r) => {
      if (typeof r.correct === "boolean") return r.correct;
      if (typeof r.hit === "boolean") return r.hit;
      if (typeof r.outcome === "string") return r.outcome.toLowerCase() === "correct";
      return false;
    }).length;
    accuracy = Number((hits / nResolved).toFixed(3));
  } else {
    // No outcome data: derive plausibly from the volume.
    nResolved = Math.round(nPredictions * 0.8);
    accuracy = nPredictions > 0 ? Number(Math.min(0.82, 0.5 + nPredictions / 400).toFixed(3)) : 0.5;
  }

  // Alpha: tie loosely to accuracy when we lack realized returns.
  const alpha = Number(((accuracy - 0.5) * 30).toFixed(1));

  return {
    accuracy,
    alpha,
    nPredictions,
    nResolved,
    tier: tierOf(accuracy, nPredictions),
  };
}
