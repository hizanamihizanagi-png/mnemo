import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// /api/watchlist — the signed-in user's saved symbols.
//
//   GET                  → { symbols: string[] }
//   POST   { symbol }     → { ok: true } | { ok: false, error }
//   DELETE ?symbol=SYM    → { ok: true } | { ok: false, error }
//
// All writes are RLS-scoped to the authed user (auth.uid()=user_id).
// In demo mode / signed-out: GET returns an empty list; writes
// return { ok: false, error: "Sign in" }.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ symbols: [] });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ symbols: [] });

  const { data } = await supabase
    .from("watchlist")
    .select("symbol")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const symbols = (data ?? []).map((r) => r.symbol as string);
  return NextResponse.json({ symbols });
}

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Sign in" });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in" });

  let symbol = "";
  try {
    const body = (await req.json()) as { symbol?: unknown };
    symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." });
  }
  if (!symbol) return NextResponse.json({ ok: false, error: "Missing symbol." });

  const { error } = await supabase
    .from("watchlist")
    .upsert({ user_id: user.id, symbol }, { onConflict: "user_id,symbol" });
  if (error) return NextResponse.json({ ok: false, error: "Could not save, try again." });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Sign in" });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in" });

  const symbol = (new URL(req.url).searchParams.get("symbol") ?? "").trim().toUpperCase();
  if (!symbol) return NextResponse.json({ ok: false, error: "Missing symbol." });

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("symbol", symbol);
  if (error) return NextResponse.json({ ok: false, error: "Could not remove, try again." });

  return NextResponse.json({ ok: true });
}
