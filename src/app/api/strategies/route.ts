import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMarketProvider } from "@/lib/market";
import { backtest, type Strategy } from "@/lib/strategy/engine";
import { isKnownSymbol } from "@/lib/universe";

// ─────────────────────────────────────────────────────────────
// /api/strategies — save & list paper-automation strategies, and
// run deterministic backtests against the market provider.
//
//   GET                          → { strategies: Strategy[] }
//   POST { action: "backtest", strategy }
//                                → { result } | { ok:false, error }
//   POST { ...strategyFields }   → { ok:true, id } | { ok:false, error }
//   DELETE ?id=UUID              → { ok:true } | { ok:false, error }
//
// The strategy config lives in the `strategies.rules` jsonb column;
// `name` is stored alongside. Writes are RLS-scoped to auth.uid().
// Demo mode / signed-out: GET → []; backtest still works (mock
// market); create/delete → { ok:false, error:"Sign in to save" }.
// Never returns a 500.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const SIGN_IN = "Sign in to save";

type RuleKind = "pctDrop" | "pctRise" | "smaCross" | "stopLoss" | "takeProfit";
const RULE_KINDS = new Set<RuleKind>([
  "pctDrop",
  "pctRise",
  "smaCross",
  "stopLoss",
  "takeProfit",
]);

// Coerce arbitrary JSON into a sane Strategy, dropping anything invalid.
function parseStrategy(raw: unknown): Strategy | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const symbol = typeof r.symbol === "string" ? r.symbol.trim().toUpperCase() : "";
  if (!symbol) return null;

  const name =
    typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 80) : `${symbol} strategy`;
  const capital = Number(r.capital);
  const interval = r.interval === "1w" ? "1w" : "1d";

  const entry = parseRule(r.entry);
  if (!entry) return null;

  const exitRaw = Array.isArray(r.exit) ? r.exit : [];
  const exit = exitRaw.map(parseRule).filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    id: typeof r.id === "string" ? r.id : undefined,
    name,
    symbol,
    capital: Number.isFinite(capital) && capital > 0 ? capital : 10000,
    entry,
    exit,
    interval,
  };
}

function parseRule(raw: unknown): { kind: RuleKind; value: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind = r.kind as RuleKind;
  if (!RULE_KINDS.has(kind)) return null;
  const value = Number(r.value);
  return { kind, value: Number.isFinite(value) ? value : 0 };
}

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ strategies: [] });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ strategies: [] });

  const { data } = await supabase
    .from("strategies")
    .select("id, name, rules")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const strategies = (data ?? [])
    .map((row) => {
      const parsed = parseStrategy({ ...(row.rules as object), id: row.id, name: row.name });
      return parsed;
    })
    .filter((s): s is Strategy => s !== null);

  return NextResponse.json({ strategies });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." });
  }

  // ── Backtest path (works in demo mode — no auth required) ──────
  if (body.action === "backtest") {
    const strategy = parseStrategy(body.strategy ?? body);
    if (!strategy) {
      return NextResponse.json({ ok: false, error: "Pick a symbol and an entry rule." });
    }
    try {
      const candles = await getMarketProvider().getCandles(strategy.symbol, 180);
      const result = backtest(strategy, candles);
      return NextResponse.json({ result });
    } catch {
      return NextResponse.json({ ok: false, error: "Could not run backtest, try again." });
    }
  }

  // ── Create path (requires auth) ────────────────────────────────
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: SIGN_IN });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: SIGN_IN });

  const strategy = parseStrategy(body.strategy ?? body);
  if (!strategy) {
    return NextResponse.json({ ok: false, error: "Pick a symbol and an entry rule." });
  }
  if (!isKnownSymbol(strategy.symbol)) {
    return NextResponse.json({ ok: false, error: "Unknown symbol." });
  }

  const automate = body.automate === true;
  // Persist the full config in `rules`; `name` mirrors it for listing.
  const rules = {
    symbol: strategy.symbol,
    capital: strategy.capital,
    entry: strategy.entry,
    exit: strategy.exit,
    interval: strategy.interval,
    automate,
  };

  const { data, error } = await supabase
    .from("strategies")
    .insert({
      user_id: user.id,
      name: strategy.name,
      description: automate ? "Paper automation enabled" : "Manual",
      rules,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Could not save, try again." });
  }
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: SIGN_IN });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: SIGN_IN });

  const id = (new URL(req.url).searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "Missing id." });

  const { error } = await supabase
    .from("strategies")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "Could not remove, try again." });

  return NextResponse.json({ ok: true });
}
