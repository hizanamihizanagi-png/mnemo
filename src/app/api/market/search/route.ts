import { NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

// ─────────────────────────────────────────────────────────────
// GET /api/market/search?q=app → { results: Quote[] }
//
// Symbol/name search over the tradable universe. Empty queries
// short-circuit to an empty list. Backs the <MarketSearch/> box.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ results: [] });
  }
  const market = getMarketProvider();
  const results = await market.search(q);
  return NextResponse.json({ results });
}
