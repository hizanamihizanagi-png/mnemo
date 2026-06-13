import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Post, Profile, Sentiment } from "@/lib/types";
import { DEMO_POSTS } from "./demo";

// ─────────────────────────────────────────────────────────────
// Feed reads. When Supabase is configured we read live rows +
// engagement counts + the viewer's like/repost state. Otherwise
// we serve a curated in-memory demo feed so the UI is never empty.
// ─────────────────────────────────────────────────────────────

interface RawPostRow {
  id: string;
  body: string;
  sentiment: Sentiment;
  cashtags: string[] | null;
  reply_to: string | null;
  created_at: string;
  author: Profile | Profile[] | null;
}

function normalizeAuthor(a: RawPostRow["author"]): Profile {
  const p = Array.isArray(a) ? a[0] : a;
  return (
    p ?? {
      id: "unknown",
      handle: "unknown",
      display_name: "Unknown",
      bio: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
    }
  );
}

export async function getFeed(opts: {
  symbol?: string;
  authorId?: string;
  limit?: number;
} = {}): Promise<Post[]> {
  const supabase = await getServerSupabase();
  const limit = opts.limit ?? 50;

  if (!supabase) {
    let posts = DEMO_POSTS;
    if (opts.symbol) {
      posts = posts.filter((p) => p.cashtags.includes(opts.symbol!.toUpperCase()));
    }
    return posts.slice(0, limit);
  }

  let query = supabase
    .from("posts")
    .select(
      "id, body, sentiment, cashtags, reply_to, created_at, author:profiles!posts_author_id_fkey(id, handle, display_name, bio, avatar_url, created_at)",
    )
    .is("reply_to", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.symbol) query = query.contains("cashtags", [opts.symbol.toUpperCase()]);
  if (opts.authorId) query = query.eq("author_id", opts.authorId);

  const { data, error } = await query;
  if (error || !data) return [];

  const ids = data.map((d) => d.id);
  const counts = await getCounts(ids);
  const viewerState = await getViewerState(ids);

  return (data as unknown as RawPostRow[]).map((row) => ({
    id: row.id,
    author: normalizeAuthor(row.author),
    body: row.body,
    sentiment: row.sentiment,
    cashtags: row.cashtags ?? [],
    reply_to: row.reply_to,
    like_count: counts.get(row.id)?.like ?? 0,
    repost_count: counts.get(row.id)?.repost ?? 0,
    reply_count: counts.get(row.id)?.reply ?? 0,
    liked_by_me: viewerState.likes.has(row.id),
    reposted_by_me: viewerState.reposts.has(row.id),
    created_at: row.created_at,
  }));
}

export async function getReplies(postId: string): Promise<Post[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("posts")
    .select(
      "id, body, sentiment, cashtags, reply_to, created_at, author:profiles!posts_author_id_fkey(id, handle, display_name, bio, avatar_url, created_at)",
    )
    .eq("reply_to", postId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (!data) return [];
  const ids = data.map((d) => d.id);
  const counts = await getCounts(ids);
  const viewerState = await getViewerState(ids);
  return (data as unknown as RawPostRow[]).map((row) => ({
    id: row.id,
    author: normalizeAuthor(row.author),
    body: row.body,
    sentiment: row.sentiment,
    cashtags: row.cashtags ?? [],
    reply_to: row.reply_to,
    like_count: counts.get(row.id)?.like ?? 0,
    repost_count: counts.get(row.id)?.repost ?? 0,
    reply_count: counts.get(row.id)?.reply ?? 0,
    liked_by_me: viewerState.likes.has(row.id),
    reposted_by_me: viewerState.reposts.has(row.id),
    created_at: row.created_at,
  }));
}

export async function getPost(postId: string): Promise<Post | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_POSTS.find((p) => p.id === postId) ?? null;
  const { data } = await supabase
    .from("posts")
    .select(
      "id, body, sentiment, cashtags, reply_to, created_at, author:profiles!posts_author_id_fkey(id, handle, display_name, bio, avatar_url, created_at)",
    )
    .eq("id", postId)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as RawPostRow;
  const counts = await getCounts([row.id]);
  const viewerState = await getViewerState([row.id]);
  return {
    id: row.id,
    author: normalizeAuthor(row.author),
    body: row.body,
    sentiment: row.sentiment,
    cashtags: row.cashtags ?? [],
    reply_to: row.reply_to,
    like_count: counts.get(row.id)?.like ?? 0,
    repost_count: counts.get(row.id)?.repost ?? 0,
    reply_count: counts.get(row.id)?.reply ?? 0,
    liked_by_me: viewerState.likes.has(row.id),
    reposted_by_me: viewerState.reposts.has(row.id),
    created_at: row.created_at,
  };
}

async function getCounts(ids: string[]) {
  const map = new Map<string, { like: number; repost: number; reply: number }>();
  if (ids.length === 0) return map;
  const supabase = await getServerSupabase();
  if (!supabase) return map;
  const { data } = await supabase
    .from("post_counts")
    .select("post_id, like_count, repost_count, reply_count")
    .in("post_id", ids);
  for (const row of data ?? []) {
    map.set(row.post_id, {
      like: row.like_count ?? 0,
      repost: row.repost_count ?? 0,
      reply: row.reply_count ?? 0,
    });
  }
  return map;
}

async function getViewerState(ids: string[]) {
  const likes = new Set<string>();
  const reposts = new Set<string>();
  if (ids.length === 0) return { likes, reposts };
  const supabase = await getServerSupabase();
  if (!supabase) return { likes, reposts };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { likes, reposts };

  const [{ data: likeRows }, { data: repostRows }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", ids),
    supabase.from("reposts").select("post_id").eq("user_id", user.id).in("post_id", ids),
  ]);
  for (const r of likeRows ?? []) likes.add(r.post_id);
  for (const r of repostRows ?? []) reposts.add(r.post_id);
  return { likes, reposts };
}
