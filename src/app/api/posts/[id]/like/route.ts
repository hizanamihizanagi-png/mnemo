import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// POST /api/posts/[id]/like — toggle a like on a post.
//
// Auth required. If the viewer already likes the post the row is
// removed; otherwise it's inserted. We then recount and return the
// fresh state so the client can reconcile its optimistic update.
// ─────────────────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Liking is unavailable in demo mode." },
      { status: 401 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to like posts." }, { status: 401 });
  }

  // Does a like already exist for (post, user)?
  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", id)
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }
    liked = false;
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ post_id: id, user_id: user.id });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }
    liked = true;
  }

  // Recount likes for this post.
  const { count } = await supabase
    .from("likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", id);

  return NextResponse.json({ ok: true, liked, like_count: count ?? 0 });
}
