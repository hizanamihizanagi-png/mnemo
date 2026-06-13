import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMarketProvider } from "@/lib/market";
import { lookupAny } from "@/lib/universe";
import type { Quote, Region } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Watchlists / "Mes listes" — the server side of Slice W.
//
// getWatchlistSymbols(): the signed-in user's saved tickers from
// the `watchlist` table (RLS-scoped). In demo mode / signed-out we
// return a curated cross-zone default so the page feels alive with
// zero env vars.
//
// getWatchlistEntries(symbols): marks each symbol to the market
// provider (live or mock) and bundles a 20-point close series for
// the sparkline plus the listing region (for zone grouping).
// ─────────────────────────────────────────────────────────────

// Cross-zone default shown to demo / signed-out visitors.
const DEMO_SYMBOLS = ["AAPL", "NVDA", "TSLA", "SNTS", "NPN", "DANGCEM"];

// One watchlist row, ready for the client view.
export interface WatchlistEntry {
  quote: Quote;
  // ~20 most recent closing prices, oldest → newest, for the sparkline.
  closes: number[];
  // Listing zone, used to group rows under region headers.
  region: Region;
}

export async function getWatchlistSymbols(): Promise<string[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [...DEMO_SYMBOLS];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [...DEMO_SYMBOLS];

  const { data } = await supabase
    .from("watchlist")
    .select("symbol")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const symbols = (data ?? []).map((r) => r.symbol as string);
  // A signed-in user with an empty list still sees the curated set,
  // so the zone view is never blank on first visit.
  return symbols.length > 0 ? symbols : [...DEMO_SYMBOLS];
}

export async function getWatchlistEntries(symbols: string[]): Promise<WatchlistEntry[]> {
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase()))).filter(Boolean);
  if (unique.length === 0) return [];

  const market = getMarketProvider();

  // One batched quote fetch, plus a small candle series per symbol.
  const [quotes, candleLists] = await Promise.all([
    market.getQuotes(unique),
    Promise.all(unique.map((sym) => market.getCandles(sym, 20))),
  ]);

  const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  const closesBySymbol = new Map(
    unique.map((sym, i) => [sym, (candleLists[i] ?? []).map((c) => c.close)]),
  );

  // Preserve the incoming order (most-recently-added first from DB).
  const entries: WatchlistEntry[] = [];
  for (const sym of unique) {
    const quote = quoteBySymbol.get(sym);
    if (!quote) continue; // Unknown symbol — skip rather than break the page.
    entries.push({
      quote,
      closes: closesBySymbol.get(sym) ?? [],
      region: lookupAny(sym)?.region ?? "US",
    });
  }
  return entries;
}
