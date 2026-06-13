import { NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

// ─────────────────────────────────────────────────────────────
// GET /api/market/candles?symbol=AAPL&days=120 → { candles: Candle[] }
//
// Returns a daily OHLCV series for the symbol. `days` defaults to
// 120 and is clamped to a sane range. Unknown symbols yield [].
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const symbol = params.get("symbol")?.trim().toUpperCase();
  if (!symbol) {
    return NextResponse.json({ candles: [] });
  }
  const rawDays = Number(params.get("days"));
  const days = Number.isFinite(rawDays) && rawDays > 0 ? Math.min(Math.floor(rawDays), 365) : 120;

  const market = getMarketProvider();
  const candles = await market.getCandles(symbol, days);
  return NextResponse.json({ candles });
}
