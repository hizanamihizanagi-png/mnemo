"use client";

import { useState } from "react";
import Link from "next/link";
import PostCard from "@/components/feed/PostCard";
import ProfilePredictions from "@/components/profile/ProfilePredictions";
import type { Post, TrackRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ProfileTabs — Posts / Predictions / Portfolio switcher on a profile.
// Client component (tab state); content is server-fetched and passed in.
// ─────────────────────────────────────────────────────────────

type Tab = "posts" | "predictions" | "portfolio";

const TABS: { id: Tab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "predictions", label: "Predictions" },
  { id: "portfolio", label: "Portfolio" },
];

export default function ProfileTabs({
  posts,
  trackRecord,
  handle,
}: {
  posts: Post[];
  trackRecord: TrackRecord;
  handle: string;
}) {
  const [tab, setTab] = useState<Tab>("posts");

  return (
    <div>
      <div className="mb-4 flex border-b border-line">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-semibold transition",
                active ? "text-slate-100" : "text-muted hover:text-slate-200",
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>

      {tab === "posts" &&
        (posts.length > 0 ? (
          <div className="card divide-y divide-line overflow-hidden">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-muted">
            @{handle} hasn&apos;t posted any insights yet.
          </div>
        ))}

      {tab === "predictions" && <ProfilePredictions trackRecord={trackRecord} posts={posts} />}

      {tab === "portfolio" && (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-200">Public portfolios are coming soon.</p>
          <p className="mt-1 text-xs text-muted">
            Traders will be able to share their paper positions for copy-trading and
            verification.
          </p>
          <Link href="/leaderboard" className="btn-ghost mt-4 inline-flex">
            See the leaderboard →
          </Link>
        </div>
      )}
    </div>
  );
}
