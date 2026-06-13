import { getMarketProvider } from "@/lib/market";
import { UNIVERSE } from "@/lib/universe";
import { fmtPct } from "@/lib/utils";

// Server component: a scrolling market ticker tape across the top.
export default async function TickerTape() {
  const market = getMarketProvider();
  const quotes = await market.getQuotes(UNIVERSE.slice(0, 14).map((u) => u.symbol));
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
              <span className="text-muted">${q.price.toFixed(2)}</span>
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
