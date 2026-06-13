import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMarketProvider } from "@/lib/market";
import { buildPortfolio, STARTING_CASH, type RawPosition } from "@/lib/trading/engine";
import type { LeaderboardEntry, Portfolio, Quote, Trade } from "@/lib/types";

// Load the current user's paper portfolio, marked to live/mock market.
export async function getPortfolio(userId: string): Promise<Portfolio> {
  const supabase = await getServerSupabase();
  const market = getMarketProvider();

  if (!supabase) {
    return buildPortfolio(STARTING_CASH, [], new Map());
  }

  const [{ data: pf }, { data: pos }] = await Promise.all([
    supabase.from("portfolios").select("cash, starting_cash").eq("user_id", userId).maybeSingle(),
    supabase.from("positions").select("symbol, quantity, avg_price").eq("user_id", userId),
  ]);

  const cash = pf?.cash ?? STARTING_CASH;
  const raw: RawPosition[] = (pos ?? []).map((p) => ({
    symbol: p.symbol,
    quantity: Number(p.quantity),
    avg_price: Number(p.avg_price),
  }));

  const quotes = await market.getQuotes(raw.map((r) => r.symbol));
  const quoteMap = new Map<string, Quote>(quotes.map((q) => [q.symbol, q]));
  return buildPortfolio(cash, raw, quoteMap);
}

export async function getTrades(userId: string, limit = 30): Promise<Trade[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("trades")
    .select("id, symbol, side, quantity, price, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((t) => ({
    id: t.id,
    symbol: t.symbol,
    side: t.side,
    quantity: Number(t.quantity),
    price: Number(t.price),
    created_at: t.created_at,
  }));
}

// Leaderboard: rank every trader by total return %. Marks all
// positions to market in one batched quote fetch.
export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const supabase = await getServerSupabase();
  const market = getMarketProvider();

  if (!supabase) {
    return DEMO_LEADERBOARD;
  }

  const { data: portfolios } = await supabase
    .from("portfolios")
    .select("user_id, cash, starting_cash, profiles(handle, display_name, avatar_url)")
    .limit(200);
  if (!portfolios) return [];

  const { data: positions } = await supabase
    .from("positions")
    .select("user_id, symbol, quantity, avg_price");

  const allSymbols = Array.from(new Set((positions ?? []).map((p) => p.symbol)));
  const quotes = await market.getQuotes(allSymbols);
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q.price]));

  const posByUser = new Map<string, { symbol: string; quantity: number; avg_price: number }[]>();
  for (const p of positions ?? []) {
    const arr = posByUser.get(p.user_id) ?? [];
    arr.push({ symbol: p.symbol, quantity: Number(p.quantity), avg_price: Number(p.avg_price) });
    posByUser.set(p.user_id, arr);
  }

  const entries: LeaderboardEntry[] = portfolios.map((pf) => {
    const prof = Array.isArray(pf.profiles) ? pf.profiles[0] : pf.profiles;
    const positionsValue = (posByUser.get(pf.user_id) ?? []).reduce(
      (sum, p) => sum + (quoteMap.get(p.symbol) ?? p.avg_price) * p.quantity,
      0,
    );
    const equity = Number(pf.cash) + positionsValue;
    const start = Number(pf.starting_cash) || STARTING_CASH;
    return {
      handle: prof?.handle ?? "trader",
      display_name: prof?.display_name ?? "Trader",
      avatar_url: prof?.avatar_url ?? null,
      equity,
      returnPct: ((equity - start) / start) * 100,
    };
  });

  return entries.sort((a, b) => b.returnPct - a.returnPct).slice(0, limit);
}

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { handle: "valuevince", display_name: "Value Vince", avatar_url: null, equity: 118420, returnPct: 18.42 },
  { handle: "chipsandsilicon", display_name: "Chips & Silicon", avatar_url: null, equity: 112300, returnPct: 12.3 },
  { handle: "quantqueen", display_name: "Quant Queen", avatar_url: null, equity: 106800, returnPct: 6.8 },
  { handle: "macromaverick", display_name: "Macro Maverick", avatar_url: null, equity: 98200, returnPct: -1.8 },
];
