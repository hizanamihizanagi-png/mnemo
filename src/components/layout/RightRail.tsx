import Link from "next/link";
import { getMarketProvider } from "@/lib/market";
import { UNIVERSE } from "@/lib/universe";
import { fmtNumber, fmtPct } from "@/lib/utils";

// Contextual right rail: live indices, today's biggest movers, and a
// trending-cashtags shortcut. Server component — uses the market provider
// (mock or live) directly. Sticky so it stays in view while the feed scrolls.
export default async function RightRail() {
  const market = getMarketProvider();
  const [indices, quotes] = await Promise.all([
    market.getIndices(),
    market.getQuotes(UNIVERSE.map((u) => u.symbol)),
  ]);

  const movers = [...quotes]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 6);

  return (
    <div className="sticky top-0 flex h-screen flex-col gap-4 overflow-y-auto p-4">
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-200">Market indices</h2>
        <ul className="space-y-2.5">
          {indices.map((idx) => {
            const up = idx.changePct >= 0;
            return (
              <li key={idx.symbol} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-200">{idx.symbol}</p>
                  <p className="truncate text-xs text-muted">{idx.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-slate-100">{fmtNumber(idx.value)}</p>
                  <p className={`text-xs ${up ? "text-bull" : "text-bear"}`}>
                    {up ? "▲" : "▼"} {fmtPct(idx.changePct)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-200">Today&apos;s movers</h2>
        <ul className="space-y-1">
          {movers.map((q) => {
            const up = q.changePct >= 0;
            return (
              <li key={q.symbol}>
                <Link
                  href={`/markets/${q.symbol}`}
                  className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-bg-soft"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200">${q.symbol}</p>
                    <p className="truncate text-xs text-muted">{q.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-slate-100">${q.price.toFixed(2)}</p>
                    <p className={`text-xs ${up ? "text-bull" : "text-bear"}`}>
                      {fmtPct(q.changePct)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/markets"
          className="mt-3 block text-center text-sm font-semibold text-brand hover:text-brand-glow"
        >
          See all markets →
        </Link>
      </section>

      <p className="px-2 text-xs leading-relaxed text-muted">
        Mnemo is a paper-trading & insights platform. Nothing here is financial
        advice. Simulated trades only.
      </p>
    </div>
  );
}
