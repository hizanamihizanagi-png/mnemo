import { getLeaderboard } from "@/lib/data/portfolio";
import LeaderboardTable from "@/components/trading/LeaderboardTable";

// ─────────────────────────────────────────────────────────────
// Leaderboard — ranks every trader by total simulated return.
// Works in demo mode (built-in demo rows). SIMULATED ONLY.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const rows = await getLeaderboard();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted">
          Traders ranked by total simulated return on their $100k paper account.
        </p>
      </header>

      <div className="mt-5">
        <LeaderboardTable rows={rows} />
      </div>

      <p className="mt-4 px-1 text-xs leading-relaxed text-muted">
        Returns are calculated on virtual cash and mark-to-market positions. For
        education & simulation only — not financial advice.
      </p>
    </div>
  );
}
