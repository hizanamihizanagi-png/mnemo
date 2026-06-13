import { NextResponse } from "next/server";
import { getAIProvider, type MarketContext } from "@/lib/ai";
import { getMarketProvider } from "@/lib/market";

// ─────────────────────────────────────────────────────────────
// GET /api/insight?symbol=AAPL → { insight: Insight }
//
// Builds a MarketContext from the live/mock quote + recent closes,
// then asks the AI provider (mock by default, no key required) for
// a structured insight + prediction. Unknown symbols → 404.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const market = getMarketProvider();
  const quote = await market.getQuote(symbol);
  if (!quote) {
    return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
  }

  const candles = await market.getCandles(symbol, 60);
  const recentCloses = candles.map((c) => c.close).slice(-30);

  const ctx: MarketContext = {
    symbol: quote.symbol,
    name: quote.name,
    price: quote.price,
    changePct: quote.changePct,
    sector: quote.sector,
    recentCloses,
  };

  const insight = await getAIProvider().generateInsight(ctx);
  return NextResponse.json({ insight });
}
