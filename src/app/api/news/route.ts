import { NextResponse } from "next/server";
import { getNews, getVolatility } from "@/lib/data/news";

// ─────────────────────────────────────────────────────────────
// /api/news — economic news + volatility for a region.
//
//   GET ?region=US|WAEMU|ZA|CEMAC|NG|EG  → { news, volatility }
//
// Deterministic per (day, region). Works in demo mode with no keys.
// Never throws / never 500s: an unknown region falls back to US.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const region = new URL(req.url).searchParams.get("region") ?? undefined;
    const [news, volatility] = await Promise.all([
      getNews(region),
      Promise.resolve(getVolatility(region)),
    ]);
    return NextResponse.json({ news, volatility });
  } catch {
    // Defensive: never surface a 500. Serve an empty, friendly payload.
    return NextResponse.json({
      news: [],
      volatility: { value: 0, label: "—" },
    });
  }
}
