import MarketMap from "@/components/market/MarketMap";
import MarketSearch from "@/components/market/MarketSearch";
import MarketTable from "@/components/market/MarketTable";
import RegionTabs from "@/components/market/RegionTabs";
import IndexCard from "@/components/market/IndexCard";
import { getMarketProvider } from "@/lib/market";
import { byRegion, indicesByRegion, INDICES, REGIONS, UNIVERSE } from "@/lib/universe";
import type { Region } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Markets index — the trading floor, now zone-aware.
//
// A region selector (Global / US / BRVM / JSE / NGX / EGX / BVMAC), a
// clickable index strip with sparklines, a 2D heatmap (toggle to 3D),
// search, and a sortable quote table with trend sparklines. Server
// component — renders with the mock provider (no keys required).
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const VALID = new Set<string>(REGIONS.map((r) => r.id));

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region: rp } = await searchParams;
  const region: Region | "global" = rp && VALID.has(rp) ? (rp as Region) : "global";
  const isGlobal = region === "global";

  const stockEntries = isGlobal ? UNIVERSE.filter((u) => u.region === "US") : byRegion(region);
  const indexEntries = isGlobal ? INDICES : indicesByRegion(region);

  const market = getMarketProvider();
  const stockSymbols = stockEntries.map((s) => s.symbol);

  const [quotes, indexQuotes] = await Promise.all([
    market.getQuotes(stockSymbols),
    market.getQuotes(indexEntries.map((i) => i.symbol)),
  ]);

  const closesMap: Record<string, number[]> = Object.fromEntries(
    await Promise.all(
      stockSymbols.map(
        async (s) => [s, (await market.getCandles(s, 30)).map((c) => c.close)] as const,
      ),
    ),
  );
  const indexClosesMap: Record<string, number[]> = Object.fromEntries(
    await Promise.all(
      indexQuotes.map(
        async (q) => [q.symbol, (await market.getCandles(q.symbol, 30)).map((c) => c.close)] as const,
      ),
    ),
  );

  const activeRegion = REGIONS.find((r) => r.id === region);

  return (
    <div className="px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">Markets</h1>
        <p className="mt-0.5 text-sm text-muted">
          {activeRegion
            ? `${activeRegion.label} — local indices, movers and AI insight.`
            : "Global markets — pick a region to surface local exchanges (BRVM, JSE, NGX, EGX, BVMAC)."}
        </p>
      </header>

      {/* Zone selector */}
      <div className="mb-4">
        <RegionTabs current={region} />
      </div>

      {/* Index strip */}
      {indexQuotes.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {indexQuotes.map((q) => (
            <IndexCard
              key={q.symbol}
              index={{
                symbol: q.symbol,
                name: q.name,
                value: q.price,
                changePct: q.changePct,
                currency: q.currency,
              }}
              closes={indexClosesMap[q.symbol]}
            />
          ))}
        </div>
      )}

      {/* Market map (2D heatmap / 3D) */}
      <div className="mb-5">
        <MarketMap quotes={quotes} />
      </div>

      {/* Search */}
      <div className="mb-5 max-w-md">
        <MarketSearch />
      </div>

      {/* Quote table with trend sparklines */}
      <MarketTable quotes={quotes} closesMap={closesMap} />
    </div>
  );
}
