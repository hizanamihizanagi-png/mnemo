// ─────────────────────────────────────────────────────────────
// Forecast Challenges — SIMULATED, reputation-building.
//
// A challenge is a time-boxed forecast question across the regions
// Mnemo covers. Users take a Yes/No stance to test conviction; when
// the window closes, correct calls feed their verified track record.
//
// This is deliberately NOT a prediction *market*: there is no betting,
// no order book, no cash payout. It supports the Proof pillar.
//
// Deterministic, seeded, pure (no env / no I/O) so it renders
// identically on server and client. A future version persists stances
// to event_positions and resolves against real data.
// ─────────────────────────────────────────────────────────────

import { clamp, hashString, mulberry32 } from "@/lib/utils";

export interface Challenge {
  id: string;
  slug: string;
  question: string;
  region: string;
  category: string;
  // The crowd's current Yes consensus, in [0, 1] — informational only.
  consensus: number;
  // How many Mnemo users have taken a stance.
  participants: number;
  // ISO timestamp at which the challenge closes & resolves.
  closeAt: string;
}

// The seeded question set. Consensus and participant counts are
// derived deterministically from each slug so the page is stable
// across renders while still feeling varied.
const SEEDS: { slug: string; question: string; region: string; category: string; days: number }[] = [
  { slug: "fed-cut-next-meeting", question: "Will the Fed cut rates at its next meeting?", region: "US", category: "Rates", days: 28 },
  { slug: "spx-new-ath-30d", question: "Will the S&P 500 print a new all-time high within 30 days?", region: "US", category: "Equities", days: 30 },
  { slug: "brvm-composite-above-250-ye", question: "Will the BRVM Composite close above 250 by year-end?", region: "WAEMU", category: "Equities", days: 120 },
  { slug: "naira-strengthens-vs-usd-q", question: "Will the Naira strengthen against the USD this quarter?", region: "NG", category: "FX", days: 75 },
  { slug: "jse-all-share-high-30d", question: "Will the JSE All Share make a new high within 30 days?", region: "ZA", category: "Equities", days: 30 },
  { slug: "egx30-above-30k-60d", question: "Will the EGX 30 close above 30,000 within 60 days?", region: "EG", category: "Equities", days: 60 },
  { slug: "beac-cemac-rate-hold", question: "Will the BEAC hold its policy rate at the next meeting?", region: "CEMAC", category: "Rates", days: 45 },
  { slug: "us-cpi-below-3-next-print", question: "Will US CPI print below 3% YoY at the next release?", region: "US", category: "Macro", days: 21 },
];

// Build the deterministic challenge list. Pure — same output every call.
export function getChallenges(): Challenge[] {
  const now = Date.now();
  return SEEDS.map((s) => {
    const rng = mulberry32(hashString(s.slug));
    const consensus = clamp(0.08 + rng() * 0.84, 0.08, 0.92);
    const participants = Math.round(40 + rng() * 4800);
    const closeAt = new Date(now + s.days * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: s.slug,
      slug: s.slug,
      question: s.question,
      region: s.region,
      category: s.category,
      consensus,
      participants,
      closeAt,
    };
  });
}
