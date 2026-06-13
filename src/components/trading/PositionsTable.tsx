import Link from "next/link";
import type { Position } from "@/lib/types";
import { cn, fmtCurrency, fmtNumber, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// PositionsTable — open paper positions marked to market.
//
// Each row links to /markets/SYMBOL and shows quantity, average
// cost, last price, market value, and unrealized P&L ($ and %,
// colored bull/bear). Server component.
// ─────────────────────────────────────────────────────────────

export default function PositionsTable({ positions }: { positions: Position[] }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-bold text-slate-200">Positions</h2>
        <span className="text-xs text-muted">{positions.length} open</span>
      </div>

      {positions.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted">
            No open positions —{" "}
            <Link href="/markets" className="font-semibold text-brand hover:text-brand-glow">
              head to Markets
            </Link>{" "}
            to place your first trade.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium text-muted">
                <th className="px-5 py-2.5 font-medium">Symbol</th>
                <th className="px-3 py-2.5 text-right font-medium">Qty</th>
                <th className="px-3 py-2.5 text-right font-medium">Avg cost</th>
                <th className="px-3 py-2.5 text-right font-medium">Last</th>
                <th className="px-3 py-2.5 text-right font-medium">Market value</th>
                <th className="px-5 py-2.5 text-right font-medium">Unrealized P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const up = p.unrealizedPnl >= 0;
                return (
                  <tr key={p.symbol} className="border-b border-line/60 last:border-0 hover:bg-bg-soft/50">
                    <td className="px-5 py-3">
                      <Link href={`/markets/${p.symbol}`} className="group inline-flex flex-col">
                        <span className="font-semibold text-slate-100 group-hover:text-brand">
                          ${p.symbol}
                        </span>
                        <span className="truncate text-xs text-muted">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-200">
                      {fmtNumber(p.quantity, 0)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      {fmtCurrency(p.avgPrice)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-200">
                      {fmtCurrency(p.lastPrice)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-100">
                      {fmtCurrency(p.marketValue)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("font-mono font-semibold", up ? "text-bull" : "text-bear")}>
                        {up ? "+" : ""}
                        {fmtCurrency(p.unrealizedPnl)}
                      </span>
                      <span className={cn("ml-1 font-mono text-xs", up ? "text-bull" : "text-bear")}>
                        ({fmtPct(p.unrealizedPnlPct)})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
