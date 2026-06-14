import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMarketProvider } from "@/lib/market";

// ─────────────────────────────────────────────────────────────
// POST /api/predictions — log a call to the user's ledger.
//
// The server stamps the authoritative entry price from the current
// quote (never trusts a client-sent price). Demo mode (no Supabase)
// returns { demo: true } so the UI can prompt the user honestly
// instead of pretending to persist.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const HORIZONS = new Set(["1d", "1w", "1m", "3m"]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  const direction = body.direction === "down" ? "down" : "up";
  const horizon = HORIZONS.has(String(body.horizon)) ? String(body.horizon) : "1m";
  const targetPct = Number(body.targetPct);
  const confidence = Number(body.confidence);
  const rationale = typeof body.rationale === "string" ? body.rationale.slice(0, 600) : null;
  const model = typeof body.model === "string" ? body.model.slice(0, 80) : null;

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ saved: false, demo: true });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const quote = await getMarketProvider().getQuote(symbol);
  if (!quote) return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });

  const { error } = await supabase.from("predictions").insert({
    user_id: user.id,
    symbol,
    direction,
    target_pct: Number.isFinite(targetPct) ? targetPct : 0,
    confidence: Number.isFinite(confidence) ? confidence : 0.5,
    horizon,
    rationale,
    model,
    entry_price: quote.price,
    resolved: false,
  });
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });

  return NextResponse.json({ saved: true, entryPrice: quote.price });
}
