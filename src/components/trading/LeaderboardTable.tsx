import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import ReputationBadge from "@/components/social/ReputationBadge";
import { demoTrackRecord } from "@/lib/reputation";
import type { LeaderboardEntry } from "@/lib/types";
import { cn, fmtCurrency, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// LeaderboardTable — traders ranked by total simulated return.
//
// Rank #1–3 get a subtle clay accent; each row links to the trader's
// profile and shows avatar, display name + @handle + reputation tier,
// prediction accuracy, return % (colored bull/bear), and equity.
// Server-safe (no hooks). Works in demo mode (built-in demo rows).
// ─────────────────────────────────────────────────────────────

export default function LeaderboardTable({ rows }: { rows: LeaderboardEntry[] }) {
  if (rows.length === 0) {
    return (
      <section className="card px-5 py-10 text-center">
        <p className="text-sm text-muted">No ranked traders yet — be the first to place a trade.</p>
      </section>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium text-muted">
              <th className="px-5 py-2.5 font-medium">Rank</th>
              <th className="px-3 py-2.5 font-medium">Trader</th>
              <th className="px-3 py-2.5 text-right font-medium">Accuracy</th>
              <th className="px-3 py-2.5 text-right font-medium">Return</th>
              <th className="px-5 py-2.5 text-right font-medium">Equity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rank = i + 1;
              const up = row.returnPct >= 0;
              const top = rank <= 3;
              const tr = demoTrackRecord(row.handle);
              return (
                <tr
                  key={row.handle}
                  className={cn(
                    "border-b border-line/60 last:border-0 hover:bg-bg-soft/50",
                    rank === 1 && "bg-brand/[0.06]",
                  )}
                >
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-bold",
                        top
                          ? "border border-brand/40 bg-brand/10 text-brand"
                          : "bg-bg-soft text-muted",
                      )}
                    >
                      {rank}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/user/${row.handle}`}
                      className="flex items-center gap-3 transition hover:opacity-80"
                    >
                      <Avatar handle={row.handle} src={row.avatar_url} size={36} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-slate-100">{row.display_name}</p>
                          <ReputationBadge tier={tr.tier} size="sm" />
                        </div>
                        <p className="truncate text-xs text-muted">@{row.handle}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate-200">
                    {Math.round(tr.accuracy * 100)}%
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn("font-mono font-semibold", up ? "text-bull" : "text-bear")}>
                      {up ? "▲" : "▼"} {fmtPct(row.returnPct)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-slate-100">
                    {fmtCurrency(row.equity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
