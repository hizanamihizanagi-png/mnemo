"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// FollowButton — optimistic follow / unfollow for a trader handle.
//
// Signed-out / demo users are routed to /login. Otherwise it POSTs or
// DELETEs /api/follow and rolls back on failure. Used on profile pages
// and in the "Who to follow" rail.
// ─────────────────────────────────────────────────────────────

export default function FollowButton({
  handle,
  initialFollowing = false,
  size = "md",
}: {
  handle: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const { user, configured } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!configured || !user) {
      router.push(`/login?next=/user/${handle}`);
      return;
    }
    if (busy) return;
    setBusy(true);

    const next = !following;
    setFollowing(next); // optimistic
    try {
      const res = await fetch(`/api/follow?handle=${encodeURIComponent(handle)}`, {
        method: next ? "POST" : "DELETE",
      });
      const data = (await res.json()) as { ok: boolean; following?: boolean };
      if (!data.ok) throw new Error("failed");
      if (typeof data.following === "boolean") setFollowing(data.following);
    } catch {
      setFollowing(!next); // roll back
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        following ? "btn-ghost" : "btn-primary",
        size === "sm" && "px-3 py-1 text-xs",
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
