import SectorVizClient from "@/components/three/SectorVizClient";
import MarketSearch from "@/components/market/MarketSearch";
import MarketTable from "@/components/market/MarketTable";
import { getMarketProvider } from "@/lib/market";
import { UNIVERSE } from "@/lib/universe";
import { fmtNumber, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Markets index — the trading floor.
//
// An indices strip up top, a 3D sector "market map" (reused WebGL
// component), a debounced search box, and a sortable quote table.
// Server component: data is fetched from the market provider (mock
// by default, live when keys are present) so it renders with no keys.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const market = getMarketProvider();
  const [indices, quotes] = await Promise.all([
    market.getIndices(),
    market.getQuotes(UNIVERSE.map((u) => u.symbol)),
  ]);

  return (
    <div className="px-4 py-5 sm:px-6">
      <header className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">Markets</h1>
        <p className="mt-0.5 text-sm text-muted">
          Explore the universe in 3D, then drill into any ticker for AI insight and paper trading.
        </p>
      </header>

      {/* Indices strip */}
      {indices.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {indices.map((idx) => {
            const up = idx.changePct >= 0;
            return (
              <div
                key={idx.symbol}
                className="flex min-w-[140px] flex-1 items-center justify-between rounded-xl border border-line bg-bg-card/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-200">{idx.symbol}</p>
                  <p className="truncate text-xs text-muted">{idx.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-slate-100">{fmtNumber(idx.value)}</p>
                  <p className={`font-mono text-xs ${up ? "text-bull" : "text-bear"}`}>
                    {up ? "▲" : "▼"} {fmtPct(idx.changePct)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3D market map */}
      <div className="mb-5 h-[420px] overflow-hidden rounded-2xl border border-line bg-bg-soft">
        <SectorVizClient quotes={quotes} />
      </div>

      {/* Search */}
      <div className="mb-5 max-w-md">
        <MarketSearch />
      </div>

      {/* Quote table */}
      <MarketTable quotes={quotes} />
    </div>
  );
}
