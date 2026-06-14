import Link from "next/link";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import {
  getFollowState,
  getProfileByHandle,
  getUserPosts,
} from "@/lib/data/profiles";
import { getUserPredictionLedger } from "@/lib/data/predictions";
import { getServerSupabase } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// /user/[handle] — a trader's public profile.
//
// Header (avatar, name, reputation, follow) + tabs (Posts / Predictions
// / Portfolio). Works in demo mode from the curated demo set. Unknown
// handles get a graceful empty state.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw).replace(/^@/, "").toLowerCase();

  const supabase = await getServerSupabase();
  let viewerId: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerId = user?.id ?? null;
  }

  const [profile, posts, followState, ledger] = await Promise.all([
    getProfileByHandle(handle),
    getUserPosts(handle),
    getFollowState(handle, viewerId),
    getUserPredictionLedger(handle),
  ]);
  const trackRecord = ledger.trackRecord;

  if (!profile) {
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <p className="text-3xl font-black text-slate-100">@{handle}</p>
        <p className="mt-2 text-muted">We couldn&apos;t find that trader.</p>
        <Link href="/explore" className="btn-primary mt-6 inline-flex">
          ← Discover traders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-[37px] z-10 flex items-center gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur">
        <Link href="/explore" className="link-muted text-sm">
          ←
        </Link>
        <div>
          <h1 className="text-base font-black tracking-tight text-slate-100">
            {profile.display_name}
          </h1>
          <p className="text-xs text-muted">{posts.length} insights</p>
        </div>
      </header>

      <div className="space-y-5 p-4">
        <ProfileHeader
          profile={profile}
          followState={followState}
          trackRecord={trackRecord}
          postCount={posts.length}
        />
        <ProfileTabs
          posts={posts}
          trackRecord={trackRecord}
          records={ledger.records}
          handle={profile.handle}
        />
      </div>
    </div>
  );
}
