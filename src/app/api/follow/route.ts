import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// /api/follow — follow / unfollow a trader by handle.
//
//   POST   { handle }  or ?handle=  → { ok, following: true }
//   DELETE ?handle=    or { handle } → { ok, following: false }
//
// Writes are RLS-scoped to the authed user (follower_id = auth.uid()).
// Demo mode / signed-out → { ok: false, error: "Sign in" }.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

async function resolveHandle(req: Request): Promise<string> {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("handle");
  if (fromQuery) return fromQuery.trim().toLowerCase();
  try {
    const body = (await req.json()) as { handle?: unknown };
    return typeof body.handle === "string" ? body.handle.trim().toLowerCase() : "";
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Sign in" });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in" });

  const handle = await resolveHandle(req);
  if (!handle) return NextResponse.json({ ok: false, error: "Missing handle." });

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (!target?.id) return NextResponse.json({ ok: false, error: "Unknown trader." });
  if (target.id === user.id) {
    return NextResponse.json({ ok: false, error: "You can't follow yourself." });
  }

  const { error } = await supabase
    .from("follows")
    .upsert(
      { follower_id: user.id, followee_id: target.id },
      { onConflict: "follower_id,followee_id" },
    );
  if (error) return NextResponse.json({ ok: false, error: "Could not follow, try again." });

  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Sign in" });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in" });

  const handle = await resolveHandle(req);
  if (!handle) return NextResponse.json({ ok: false, error: "Missing handle." });

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (!target?.id) return NextResponse.json({ ok: false, error: "Unknown trader." });

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", target.id);
  if (error) return NextResponse.json({ ok: false, error: "Could not unfollow, try again." });

  return NextResponse.json({ ok: true, following: false });
}
