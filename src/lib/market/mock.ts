import type { Candle, MarketIndex, Quote } from "@/lib/types";
import { INDICES, lookupAny, UNIVERSE } from "@/lib/universe";
import { hashString, mulberry32 } from "@/lib/utils";
import type { MarketProvider } from "./types";

// ─────────────────────────────────────────────────────────────
// Deterministic mock market.
//
// Prices evolve as a smooth pseudo-random walk seeded by the
// symbol + the current calendar day, so:
//   • Everyone sees the same prices on the same day (stable).
//   • Prices drift intraday (feels live) without flickering.
//   • No network or API key is ever required.
// ─────────────────────────────────────────────────────────────

function dayBucket(): number {
  // Number of whole days since epoch — changes once per day.
  return Math.floor(Date.now() / 86_400_000);
}

// Build a deterministic candle series ending "today".
function buildSeries(symbol: string, seed: number, days: number): Candle[] {
  const rand = mulberry32(hashString(symbol) ^ 0x9e3779b9);
  const candles: Candle[] = [];
  let price = seed * (0.82 + rand() * 0.12); // start below the seed and trend up
  const drift = (seed - price) / days; // gentle upward bias toward the seed
  const vol = seed * 0.018; // daily volatility ~1.8%

  const todayStart = Math.floor(Date.now() / 86_400_000) * 86_400;
  for (let i = days - 1; i >= 0; i--) {
    const time = todayStart - i * 86_400;
    const shock = (rand() - 0.5) * 2 * vol;
    const open = price;
    const close = Math.max(0.5, open + drift + shock);
    const high = Math.max(open, close) * (1 + rand() * 0.012);
    const low = Math.min(open, close) * (1 - rand() * 0.012);
    const volume = Math.floor((0.5 + rand()) * 8_000_000);
    candles.push({ time, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

// Intraday drift overlay so the latest price moves through the day.
function intradayAdjust(symbol: string, base: number): number {
  const rand = mulberry32(hashString(symbol + ":" + dayBucket()));
  const phase = rand() * Math.PI * 2;
  const amplitude = 0.012; // up to ~1.2% intraday swing
  const minuteOfDay = (Date.now() % 86_400_000) / 60_000;
  const wave = Math.sin(phase + minuteOfDay / 90) * amplitude;
  const noise = (rand() - 0.5) * 0.004;
  return base * (1 + wave + noise);
}

function quoteFor(symbol: string): Quote | null {
  // Resolve via lookupAny so ANY symbol — stock or index, any region —
  // returns a Quote. Indices get sector "Index" and no marketCap.
  const u = lookupAny(symbol);
  if (!u) return null;
  const series = buildSeries(u.symbol, u.seed, 120);
  const today = series[series.length - 1];
  const prevClose = series[series.length - 2]?.close ?? today.open;
  const price = intradayAdjust(u.symbol, today.close);
  const change = price - prevClose;
  const changePct = (change / prevClose) * 100;
  const rand = mulberry32(hashString(u.symbol) ^ 0x55555555);
  const shares = (0.8 + rand() * 6) * 1e9;
  return {
    symbol: u.symbol,
    name: u.name,
    price,
    change,
    changePct,
    open: today.open,
    high: Math.max(today.high, price),
    low: Math.min(today.low, price),
    prevClose,
    // Indices have no market cap; use the entry's local currency.
    marketCap: u.isIndex ? undefined : price * shares,
    currency: u.currency,
    sector: u.sector,
  };
}

export const mockMarket: MarketProvider = {
  name: "mock",

  async getQuote(symbol) {
    return quoteFor(symbol);
  },

  async getQuotes(symbols) {
    return symbols
      .map((s) => quoteFor(s))
      .filter((q): q is Quote => q !== null);
  },

  async getCandles(symbol, days) {
    // lookupAny resolves stocks AND indices in any region.
    const u = lookupAny(symbol);
    if (!u) return [];
    const series = buildSeries(u.symbol, u.seed, Math.max(days, 2));
    // Replace the last close with the live intraday price.
    const last = series[series.length - 1];
    last.close = intradayAdjust(u.symbol, last.close);
    last.high = Math.max(last.high, last.close);
    last.low = Math.min(last.low, last.close);
    return series;
  },

  async getIndices(): Promise<MarketIndex[]> {
    return INDICES.map((idx) => {
      const series = buildSeries(idx.symbol, idx.seed, 30);
      const today = series[series.length - 1];
      const prev = series[series.length - 2]?.close ?? today.open;
      const value = intradayAdjust(idx.symbol, today.close);
      const change = value - prev;
      return {
        symbol: idx.symbol,
        name: idx.name,
        value,
        change,
        changePct: (change / prev) * 100,
      };
    });
  },

  async search(query) {
    const q = query.trim().toUpperCase();
    if (!q) return [];
    const hits = UNIVERSE.filter(
      (u) => u.symbol.includes(q) || u.name.toUpperCase().includes(q),
    ).slice(0, 8);
    return hits
      .map((u) => quoteFor(u.symbol))
      .filter((x): x is Quote => x !== null);
  },
};
