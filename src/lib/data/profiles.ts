import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { getFeed } from "@/lib/data/feed";
import { DEMO_POSTS, DEMO_PROFILES } from "@/lib/data/demo";
import { demoTrackRecord, trackRecordFromPredictions } from "@/lib/reputation";
import type { FollowState, Post, Profile, TrackRecord } from "@/lib/types";
import { hashString, mulberry32 } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Profile reads for the public /user/[handle] page.
//
// Live (Supabase configured) reads real rows; otherwise we serve the
// curated demo set so every profile, follow count, and track record is
// populated out of the box. Nothing here ever throws.
// ─────────────────────────────────────────────────────────────

const PROFILE_COLS = "id, handle, display_name, bio, avatar_url, created_at";

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  const h = handle.toLowerCase();
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_PROFILES[h] ?? null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("handle", h)
    .maybeSingle();
  return (data as Profile | null) ?? DEMO_PROFILES[h] ?? null;
}

export async function getUserPosts(handle: string): Promise<Post[]> {
  const h = handle.toLowerCase();
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_POSTS.filter((p) => p.author.handle === h);

  const { data } = await supabase.from("profiles").select("id").eq("handle", h).maybeSingle();
  if (!data?.id) return [];
  return getFeed({ authorId: data.id, limit: 50 });
}

export async function getFollowState(
  handle: string,
  viewerId?: string | null,
): Promise<FollowState> {
  const h = handle.toLowerCase();
  const supabase = await getServerSupabase();

  if (!supabase) {
    // Deterministic demo counts so the UI is stable across refreshes.
    const rand = mulberry32(hashString("follow:" + h));
    return {
      following: false,
      followers: 40 + Math.floor(rand() * 9600),
      following_count: 30 + Math.floor(rand() * 400),
    };
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", h)
    .maybeSingle();
  if (!prof?.id) return { following: false, followers: 0, following_count: 0 };

  const [{ count: followers }, { count: following_count }, viewerRow] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", prof.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", prof.id),
    viewerId
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewerId)
          .eq("followee_id", prof.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    following: Boolean((viewerRow as { data: unknown }).data),
    followers: followers ?? 0,
    following_count: following_count ?? 0,
  };
}

export async function getUserTrackRecord(handle: string): Promise<TrackRecord> {
  const h = handle.toLowerCase();
  const supabase = await getServerSupabase();
  if (!supabase) return demoTrackRecord(h);

  const { data: prof } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", h)
    .maybeSingle();
  if (!prof?.id) return demoTrackRecord(h);

  const { data: preds } = await supabase
    .from("predictions")
    .select("direction, target_pct, confidence, horizon, created_at")
    .eq("user_id", prof.id)
    .limit(500);

  if (!preds || preds.length === 0) return demoTrackRecord(h);
  return trackRecordFromPredictions(preds);
}
