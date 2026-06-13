import Link from "next/link";
import type { Quote } from "@/lib/types";
import { cn, fmtCompact, fmtCurrency, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// MarketTable — a clean, dense quote table for the markets page.
//
// Server component. Each row links to /markets/SYMBOL. Rows are
// pre-sorted by absolute change (biggest movers first) so the table
// reads as "what's moving today". Prices/changes use the mono font.
// ─────────────────────────────────────────────────────────────

export default function MarketTable({ quotes }: { quotes: Quote[] }) {
  const rows = [...quotes].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-semibold">Symbol</th>
            <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Sector</th>
            <th className="px-4 py-2.5 text-right font-semibold">Price</th>
            <th className="px-4 py-2.5 text-right font-semibold">Change</th>
            <th className="hidden px-4 py-2.5 text-right font-semibold md:table-cell">Mkt Cap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => {
            const up = q.changePct >= 0;
            return (
              <tr key={q.symbol} className="group border-b border-line/60 last:border-0">
                <td className="px-4 py-2.5">
                  <Link href={`/markets/${q.symbol}`} className="block">
                    <span className="font-bold text-slate-100 group-hover:text-brand">
                      {q.symbol}
                    </span>
                    <span className="ml-2 hidden text-xs text-muted sm:inline">{q.name}</span>
                  </Link>
                </td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                  <Link href={`/markets/${q.symbol}`} className="text-xs text-muted">
                    {q.sector}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/markets/${q.symbol}`} className="font-mono text-slate-100">
                    {fmtCurrency(q.price)}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/markets/${q.symbol}`}
                    className={cn("font-mono font-semibold", up ? "text-bull" : "text-bear")}
                  >
                    {up ? "▲" : "▼"} {fmtPct(q.changePct)}
                  </Link>
                </td>
                <td className="hidden px-4 py-2.5 text-right md:table-cell">
                  <Link href={`/markets/${q.symbol}`} className="font-mono text-muted">
                    {q.marketCap ? `$${fmtCompact(q.marketCap)}` : "—"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
