import { NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

// ─────────────────────────────────────────────────────────────
// GET /api/market/quote?symbol=AAPL → { quote: Quote | null }
//
// Thin wrapper over the market provider (mock or live). Used by
// client widgets that need a fresh single quote without a page nav.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol) {
    return NextResponse.json({ quote: null });
  }
  const market = getMarketProvider();
  const quote = await market.getQuote(symbol);
  return NextResponse.json({ quote });
}
