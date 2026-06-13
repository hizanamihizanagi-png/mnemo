import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPost } from "@/lib/data/feed";
import { moderatePost } from "@/lib/moderation";
import type { Sentiment } from "@/lib/types";
import { extractCashtags } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// POST /api/posts — create a new post (or reply).
//
// Requires an authenticated session. Runs the finance topic guard
// before writing; off-topic content is rejected with the moderator's
// reason. Cashtags are derived server-side from the body. Inserts with
// author_id = auth.uid() so RLS is satisfied automatically.
// ─────────────────────────────────────────────────────────────

const VALID_SENTIMENTS: Sentiment[] = ["bullish", "bearish", "neutral"];

interface PostBody {
  body?: unknown;
  sentiment?: unknown;
  reply_to?: unknown;
}

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Posting is unavailable in demo mode." },
      { status: 401 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to post." }, { status: 401 });
  }

  // Parse + validate the payload.
  let payload: PostBody;
  try {
    payload = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body) {
    return NextResponse.json({ ok: false, error: "Post can't be empty." }, { status: 400 });
  }

  const sentiment: Sentiment = VALID_SENTIMENTS.includes(payload.sentiment as Sentiment)
    ? (payload.sentiment as Sentiment)
    : "neutral";

  const reply_to =
    typeof payload.reply_to === "string" && payload.reply_to.length > 0
      ? payload.reply_to
      : null;

  // Finance topic guard.
  const mod = await moderatePost(body);
  if (!mod.allowed) {
    return NextResponse.json({ ok: false, error: mod.reason, moderation: mod }, { status: 200 });
  }

  const cashtags = extractCashtags(body);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      body,
      sentiment,
      cashtags,
      reply_to,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Could not save your post." },
      { status: 200 },
    );
  }

  // Re-read so callers can render the fully-shaped Post immediately.
  const post = await getPost(data.id);
  return NextResponse.json({ ok: true, id: data.id, post });
}
