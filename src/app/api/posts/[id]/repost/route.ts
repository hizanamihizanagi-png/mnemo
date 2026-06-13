import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// POST /api/posts/[id]/repost — toggle a repost on a post.
//
// Auth required. Mirrors the like route: insert if absent, delete if
// present, then recount and return the fresh state.
// ─────────────────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Reposting is unavailable in demo mode." },
      { status: 401 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to repost." }, { status: 401 });
  }

  // Does a repost already exist for (post, user)?
  const { data: existing } = await supabase
    .from("reposts")
    .select("post_id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  let reposted: boolean;
  if (existing) {
    const { error } = await supabase
      .from("reposts")
      .delete()
      .eq("post_id", id)
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }
    reposted = false;
  } else {
    const { error } = await supabase
      .from("reposts")
      .insert({ post_id: id, user_id: user.id });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }
    reposted = true;
  }

  // Recount reposts for this post.
  const { count } = await supabase
    .from("reposts")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", id);

  return NextResponse.json({ ok: true, reposted, repost_count: count ?? 0 });
}
