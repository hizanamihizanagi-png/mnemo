import Avatar from "@/components/ui/Avatar";
import type { LeaderboardEntry } from "@/lib/types";
import { cn, fmtCurrency, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// LeaderboardTable — traders ranked by total simulated return.
//
// Rank #1–3 get medal styling; each row shows the trader's avatar,
// display name + @handle, return % (colored bull/bear), and equity.
// Server component. Works in demo mode (built-in demo rows).
// ─────────────────────────────────────────────────────────────

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

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
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium text-muted">
              <th className="px-5 py-2.5 font-medium">Rank</th>
              <th className="px-3 py-2.5 font-medium">Trader</th>
              <th className="px-3 py-2.5 text-right font-medium">Return</th>
              <th className="px-5 py-2.5 text-right font-medium">Equity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rank = i + 1;
              const up = row.returnPct >= 0;
              const top = rank <= 3;
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
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                        top ? "text-base" : "bg-bg-soft font-mono text-muted",
                      )}
                    >
                      {MEDALS[rank] ?? rank}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar handle={row.handle} src={row.avatar_url} size={36} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">{row.display_name}</p>
                        <p className="truncate text-xs text-muted">@{row.handle}</p>
                      </div>
                    </div>
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
