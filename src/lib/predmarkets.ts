// ─────────────────────────────────────────────────────────────
// Predictive markets (Kalshi / Polymarket-style) — SIMULATED.
//
// Deterministic, seeded mock of binary event markets across the
// regions Mnemo covers. Pure functions only: no env, no I/O, so
// they render identically on server and client (demo-safe).
//
// A future integration would replace getEventMarkets() with a
// fetch to Kalshi / Polymarket; the EventMarket shape is the
// stable contract the UI binds to.
// ─────────────────────────────────────────────────────────────

import { clamp, hashString, mulberry32 } from "@/lib/utils";

export interface EventMarket {
  id: string;
  slug: string;
  question: string;
  region: string;
  category: string;
  // Implied probability of "Yes", in [0, 1].
  yesPrice: number;
  // Notional simulated volume (in USD).
  volume: number;
  // ISO timestamp at which the market closes.
  closeAt: string;
}

// The seeded question set. Prices and volume are derived
// deterministically from each slug so the page is stable across
// renders while still feeling varied.
const SEEDS: { slug: string; question: string; region: string; category: string; days: number }[] = [
  {
    slug: "fed-cut-next-meeting",
    question: "Fed cuts rates at next meeting?",
    region: "US",
    category: "Rates",
    days: 28,
  },
  {
    slug: "spx-new-ath-30d",
    question: "S&P 500 prints a new all-time high in 30 days?",
    region: "US",
    category: "Equities",
    days: 30,
  },
  {
    slug: "brvm-composite-above-250-ye",
    question: "BRVM Composite > 250 by year-end?",
    region: "WAEMU",
    category: "Equities",
    days: 120,
  },
  {
    slug: "naira-strengthens-vs-usd-q",
    question: "Naira strengthens vs USD this quarter?",
    region: "NG",
    category: "FX",
    days: 75,
  },
  {
    slug: "jse-all-share-high-30d",
    question: "JSE All Share new high in 30 days?",
    region: "ZA",
    category: "Equities",
    days: 30,
  },
  {
    slug: "egx30-above-30k-60d",
    question: "EGX 30 closes above 30,000 within 60 days?",
    region: "EG",
    category: "Equities",
    days: 60,
  },
  {
    slug: "boj-cemac-rate-hold",
    question: "BEAC holds its policy rate at the next meeting?",
    region: "CEMAC",
    category: "Rates",
    days: 45,
  },
  {
    slug: "us-cpi-below-3-next-print",
    question: "US CPI prints below 3% YoY next release?",
    region: "US",
    category: "Macro",
    days: 21,
  },
];

// Build the deterministic market list. Each market's "Yes" price is
// seeded from its slug and nudged toward a plausible band; volume is
// likewise seeded. Pure — same output every call.
export function getEventMarkets(): EventMarket[] {
  const now = Date.now();
  return SEEDS.map((s) => {
    const rng = mulberry32(hashString(s.slug));
    // First draw → probability, kept off the rails (3%..97%).
    const yesPrice = clamp(0.03 + rng() * 0.94, 0.03, 0.97);
    // Second/third draws → a varied but stable volume figure.
    const volume = Math.round((10_000 + rng() * 1_900_000) / 100) * 100;
    const closeAt = new Date(now + s.days * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: s.slug,
      slug: s.slug,
      question: s.question,
      region: s.region,
      category: s.category,
      yesPrice,
      volume,
      closeAt,
    };
  });
}
