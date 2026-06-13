"use client";

import { useMemo, useState } from "react";
import LeaderboardTable from "@/components/trading/LeaderboardTable";
import { demoTrackRecord } from "@/lib/reputation";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// LeaderboardTabs — segmented control switching the ranking basis:
//   "Top Return"   → rows as received (sorted by return upstream)
//   "Best Accuracy" → re-sorted client-side by demo track-record accuracy
// Re-uses <LeaderboardTable /> for the actual rendering.
// ─────────────────────────────────────────────────────────────

type Tab = "return" | "accuracy";

const TABS: { id: Tab; label: string }[] = [
  { id: "return", label: "Top Return" },
  { id: "accuracy", label: "Best Accuracy" },
];

export default function LeaderboardTabs({ rows }: { rows: LeaderboardEntry[] }) {
  const [tab, setTab] = useState<Tab>("return");

  const sorted = useMemo(() => {
    if (tab === "return") return rows;
    // Sort by deterministic demo accuracy, then by return as a tiebreaker.
    return [...rows].sort((a, b) => {
      const accA = demoTrackRecord(a.handle).accuracy;
      const accB = demoTrackRecord(b.handle).accuracy;
      if (accB !== accA) return accB - accA;
      return b.returnPct - a.returnPct;
    });
  }, [rows, tab]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Leaderboard ranking"
        className="mb-4 inline-flex rounded-lg border border-line bg-bg-soft p-0.5"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-bg-elevated text-slate-100 shadow-glow"
                  : "text-muted hover:text-slate-200",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <LeaderboardTable rows={sorted} />
    </div>
  );
}
