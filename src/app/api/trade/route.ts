import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMarketProvider } from "@/lib/market";
import {
  applyOrder,
  makeTrade,
  STARTING_CASH,
  type RawPosition,
} from "@/lib/trading/engine";

// ─────────────────────────────────────────────────────────────
// POST /api/trade — place a simulated market order.
//
// Prices the order off the live/mock quote, runs the pure paper-
// trading engine (applyOrder), then persists the single touched
// symbol + cash + a trade record against the user's RLS-scoped
// rows. SIMULATED ONLY — no real securities are traded.
//
// Request:  { symbol: string, side: "buy"|"sell", quantity: number }
// Response: { ok: true, fillPrice: number, cash: number }
//        |  { ok: false, error: string }
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

interface TradeBody {
  symbol?: unknown;
  side?: unknown;
  quantity?: unknown;
}

export async function POST(req: Request) {
  // a. Supabase configured?
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({
      ok: false,
      error: "Paper trading needs an account. Connect Supabase.",
    });
  }

  // b. Authenticated?
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to paper-trade." });
  }

  // c. Parse + validate the request body.
  let body: TradeBody;
  try {
    body = (await req.json()) as TradeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." });
  }

  const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
  const side = body.side;
  const quantity = Number(body.quantity);

  if (!symbol) {
    return NextResponse.json({ ok: false, error: "Missing symbol." });
  }
  if (side !== "buy" && side !== "sell") {
    return NextResponse.json({ ok: false, error: "Side must be buy or sell." });
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({
      ok: false,
      error: "Quantity must be a positive whole number.",
    });
  }

  // d. Price the order off the market provider.
  const quote = await getMarketProvider().getQuote(symbol);
  if (!quote) {
    return NextResponse.json({ ok: false, error: "No market price for that symbol." });
  }
  const fillPrice = quote.price;

  try {
    // e. Load current cash + positions.
    const [{ data: pf }, { data: pos }] = await Promise.all([
      supabase.from("portfolios").select("cash").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("positions")
        .select("symbol, quantity, avg_price")
        .eq("user_id", user.id),
    ]);

    const cash = pf?.cash != null ? Number(pf.cash) : STARTING_CASH;
    const rawPositions: RawPosition[] = (pos ?? []).map((p) => ({
      symbol: p.symbol,
      quantity: Number(p.quantity),
      avg_price: Number(p.avg_price),
    }));

    // f. Run the pure engine.
    const result = applyOrder(cash, rawPositions, { symbol, side, quantity }, fillPrice);
    if (!result.ok || result.cash == null || !result.positions) {
      return NextResponse.json({
        ok: false,
        error: result.error ?? "Order rejected.",
      });
    }

    // g. Persist. The order touches exactly ONE symbol, so sync just
    //    that symbol + cash + insert a trade record.
    const { error: pfError } = await supabase.from("portfolios").upsert(
      {
        user_id: user.id,
        cash: result.cash,
        starting_cash: STARTING_CASH,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (pfError) throw pfError;

    const traded = result.positions.find((p) => p.symbol === symbol);
    if (traded) {
      const { error: posError } = await supabase.from("positions").upsert(
        {
          user_id: user.id,
          symbol: traded.symbol,
          quantity: traded.quantity,
          avg_price: traded.avg_price,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,symbol" },
      );
      if (posError) throw posError;
    } else {
      // Fully sold out — remove the row.
      const { error: delError } = await supabase
        .from("positions")
        .delete()
        .eq("user_id", user.id)
        .eq("symbol", symbol);
      if (delError) throw delError;
    }

    const trade = makeTrade({ symbol, side, quantity }, fillPrice);
    const { error: tradeError } = await supabase.from("trades").insert({
      user_id: user.id,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
    });
    if (tradeError) throw tradeError;

    // h. Success.
    return NextResponse.json({ ok: true, fillPrice, cash: result.cash });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not place order, try again." });
  }
}
