import type { Candle, MarketIndex, Quote } from "@/lib/types";
import { lookup, UNIVERSE } from "@/lib/universe";
import type { MarketProvider } from "./types";

// ─────────────────────────────────────────────────────────────
// Finnhub adapter (https://finnhub.io). Free tier covers quotes
// and basic candles. Falls back to null/empty on errors so the
// caller can degrade gracefully to the mock provider.
// ─────────────────────────────────────────────────────────────

const BASE = "https://finnhub.io/api/v1";

function key(): string {
  const k = process.env.FINNHUB_API_KEY;
  if (!k) throw new Error("FINNHUB_API_KEY is not set");
  return k;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}&token=${key()}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface FinnhubQuote {
  c: number; // current
  d: number; // change
  dp: number; // percent change
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
}

export const finnhubMarket: MarketProvider = {
  name: "finnhub",

  async getQuote(symbol) {
    const u = lookup(symbol);
    const data = await fetchJson<FinnhubQuote>(`/quote?symbol=${symbol.toUpperCase()}`);
    if (!data || !data.c) return null;
    return {
      symbol: symbol.toUpperCase(),
      name: u?.name ?? symbol.toUpperCase(),
      price: data.c,
      change: data.d,
      changePct: data.dp,
      open: data.o,
      high: data.h,
      low: data.l,
      prevClose: data.pc,
      currency: "USD",
      sector: u?.sector ?? "—",
    };
  },

  async getQuotes(symbols) {
    const results = await Promise.all(symbols.map((s) => this.getQuote(s)));
    return results.filter((q): q is Quote => q !== null);
  },

  async getCandles(symbol, days) {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 86_400;
    const data = await fetchJson<{
      c: number[];
      h: number[];
      l: number[];
      o: number[];
      t: number[];
      v: number[];
      s: string;
    }>(`/stock/candle?symbol=${symbol.toUpperCase()}&resolution=D&from=${from}&to=${to}`);
    if (!data || data.s !== "ok") return [];
    const candles: Candle[] = [];
    for (let i = 0; i < data.t.length; i++) {
      candles.push({
        time: data.t[i],
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i],
      });
    }
    return candles;
  },

  async getIndices(): Promise<MarketIndex[]> {
    // Index data is gated on Finnhub's paid tiers; use ETF proxies.
    const proxies = [
      { symbol: "SPY", name: "S&P 500 (SPY)" },
      { symbol: "QQQ", name: "Nasdaq 100 (QQQ)" },
      { symbol: "DIA", name: "Dow Jones (DIA)" },
    ];
    const out: MarketIndex[] = [];
    for (const p of proxies) {
      const q = await fetchJson<FinnhubQuote>(`/quote?symbol=${p.symbol}`);
      if (q && q.c) {
        out.push({
          symbol: p.symbol,
          name: p.name,
          value: q.c,
          change: q.d,
          changePct: q.dp,
        });
      }
    }
    return out;
  },

  async search(query) {
    const q = query.trim().toUpperCase();
    const candidates = UNIVERSE.filter(
      (u) => u.symbol.includes(q) || u.name.toUpperCase().includes(q),
    ).slice(0, 6);
    return this.getQuotes(candidates.map((c) => c.symbol));
  },
};
