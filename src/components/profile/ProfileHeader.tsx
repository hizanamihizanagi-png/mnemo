import Avatar from "@/components/ui/Avatar";
import ReputationBadge from "@/components/social/ReputationBadge";
import FollowButton from "@/components/social/FollowButton";
import type { FollowState, Profile, TrackRecord } from "@/lib/types";
import { fmtCompact } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ProfileHeader — the banner atop /user/[handle].
// Avatar, name + handle + reputation tier, bio, a follow button, and a
// stat row (Posts / Followers / Following / Accuracy). Server-safe.
// ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-lg font-bold text-slate-100">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export default function ProfileHeader({
  profile,
  followState,
  trackRecord,
  postCount,
}: {
  profile: Profile;
  followState: FollowState;
  trackRecord: TrackRecord;
  postCount: number;
}) {
  return (
    <header className="card p-5">
      <div className="flex items-start gap-4">
        <Avatar handle={profile.handle} src={profile.avatar_url} size={80} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-100">
              {profile.display_name}
            </h1>
            <ReputationBadge tier={trackRecord.tier} accuracy={trackRecord.accuracy} />
          </div>
          <p className="text-sm text-muted">@{profile.handle}</p>
          {profile.bio && (
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{profile.bio}</p>
          )}
        </div>
        <FollowButton handle={profile.handle} initialFollowing={followState.following} />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 border-t border-line pt-4">
        <Stat label="Posts" value={fmtCompact(postCount)} />
        <Stat label="Followers" value={fmtCompact(followState.followers)} />
        <Stat label="Following" value={fmtCompact(followState.following_count)} />
        <Stat label="Accuracy" value={`${Math.round(trackRecord.accuracy * 100)}%`} />
      </div>
    </header>
  );
}
