import { getWatchlistSymbols, getWatchlistEntries } from "@/lib/data/watchlist";
import WatchlistView from "@/components/market/WatchlistView";

// ─────────────────────────────────────────────────────────────
// Watchlist — "Mes listes" by zone (Slice W).
//
// Server-rendered initial state: the user's saved symbols marked to
// market, grouped by region in the client view. Degrades gracefully
// in demo / signed-out mode via the curated default set.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const symbols = await getWatchlistSymbols();
  const entries = await getWatchlistEntries(symbols);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Mes listes</h1>
        <p className="mt-1 text-sm text-muted">
          Suis tes valeurs par zone — mini-graphes et variations en direct.
        </p>
      </header>
      <div className="mt-5">
        <WatchlistView initial={entries} />
      </div>
    </div>
  );
}
