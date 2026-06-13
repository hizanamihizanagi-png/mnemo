import Link from "next/link";
import Sparkline from "@/components/ui/Sparkline";
import { getMarketProvider } from "@/lib/market";
import { UNIVERSE } from "@/lib/universe";
import { fmtMoney, fmtNumber, fmtPct } from "@/lib/utils";

// Contextual right rail: live indices (clickable, with sparklines),
// today's biggest movers, and a link to all markets. Server component —
// uses the market provider (mock or live) directly. Sticky so it stays
// in view while the feed scrolls.
export default async function RightRail() {
  const market = getMarketProvider();
  const [indices, quotes] = await Promise.all([
    market.getIndices(),
    market.getQuotes(UNIVERSE.filter((u) => u.region === "US").map((u) => u.symbol)),
  ]);

  const movers = [...quotes]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 6);

  // Sparkline series for indices + movers (mock provider is cheap).
  const idxCloses: Record<string, number[]> = Object.fromEntries(
    await Promise.all(
      indices.map(async (i) => [i.symbol, (await market.getCandles(i.symbol, 20)).map((c) => c.close)] as const),
    ),
  );
  const moverCloses: Record<string, number[]> = Object.fromEntries(
    await Promise.all(
      movers.map(async (m) => [m.symbol, (await market.getCandles(m.symbol, 20)).map((c) => c.close)] as const),
    ),
  );

  return (
    <div className="sticky top-0 flex h-screen flex-col gap-4 overflow-y-auto p-4">
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-200">Market indices</h2>
        <ul className="space-y-1">
          {indices.map((idx) => {
            const up = idx.changePct >= 0;
            return (
              <li key={idx.symbol}>
                <Link
                  href={`/markets/${idx.symbol}`}
                  className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition hover:bg-bg-soft"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200">{idx.symbol}</p>
                    <p className="truncate text-xs text-muted">{idx.name}</p>
                  </div>
                  {idxCloses[idx.symbol]?.length > 1 && (
                    <Sparkline data={idxCloses[idx.symbol]} width={56} height={26} up={up} area />
                  )}
                  <div className="text-right">
                    <p className="font-mono text-sm text-slate-100">{fmtNumber(idx.value)}</p>
                    <p className={`text-xs ${up ? "text-bull" : "text-bear"}`}>
                      {up ? "▲" : "▼"} {fmtPct(idx.changePct)}
                    </p>
                  </div>
                </Link>
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
                  className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition hover:bg-bg-soft"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200">${q.symbol}</p>
                    <p className="truncate text-xs text-muted">{q.name}</p>
                  </div>
                  {moverCloses[q.symbol]?.length > 1 && (
                    <Sparkline data={moverCloses[q.symbol]} width={48} height={24} up={up} area />
                  )}
                  <div className="text-right">
                    <p className="font-mono text-sm text-slate-100">{fmtMoney(q.price, q.currency)}</p>
                    <p className={`text-xs ${up ? "text-bull" : "text-bear"}`}>{fmtPct(q.changePct)}</p>
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
