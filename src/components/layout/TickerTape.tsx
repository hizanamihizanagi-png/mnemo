import { getMarketProvider } from "@/lib/market";
import { byRegion, UNIVERSE } from "@/lib/universe";
import { fmtMoney, fmtPct } from "@/lib/utils";

// Server component: a scrolling market ticker tape across the top.
// Spans US + a sampling of local exchanges (BRVM, JSE, NGX, EGX).
export default async function TickerTape() {
  const picks = [
    ...UNIVERSE.filter((u) => u.region === "US").slice(0, 8),
    ...byRegion("WAEMU").slice(0, 2),
    ...byRegion("ZA").slice(0, 2),
    ...byRegion("NG").slice(0, 1),
    ...byRegion("EG").slice(0, 1),
  ];

  const market = getMarketProvider();
  const quotes = await market.getQuotes(picks.map((u) => u.symbol));
  if (quotes.length === 0) return null;

  // Duplicate the list so the CSS marquee loops seamlessly.
  const items = [...quotes, ...quotes];

  return (
    <div className="ticker-mask overflow-hidden border-b border-line bg-bg-soft/80">
      <div className="flex w-max animate-ticker gap-6 py-2">
        {items.map((q, i) => {
          const up = q.changePct >= 0;
          return (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap text-xs">
              <span className="font-bold text-slate-200">{q.symbol}</span>
              <span className="text-muted">{fmtMoney(q.price, q.currency)}</span>
              <span className={up ? "text-bull" : "text-bear"}>
                {up ? "▲" : "▼"} {fmtPct(q.changePct)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
