import Link from "next/link";
import type { Trade } from "@/lib/types";
import { cn, fmtCurrency, fmtNumber, timeAgo } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TradesList — recent paper-trade history.
//
// Each entry shows the side (buy=bull / sell=bear), quantity,
// fill price, symbol, and relative time. Server component.
// ─────────────────────────────────────────────────────────────

export default function TradesList({ trades }: { trades: Trade[] }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-bold text-slate-200">Trade history</h2>
      </div>

      {trades.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted">No trades yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line/60">
          {trades.map((t) => {
            const buy = t.side === "buy";
            return (
              <li key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-bg-soft/50">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex w-12 justify-center rounded-md px-2 py-1 text-xs font-bold uppercase",
                      buy ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear",
                    )}
                  >
                    {t.side}
                  </span>
                  <div>
                    <p className="text-sm text-slate-200">
                      <span className="font-mono">{fmtNumber(t.quantity, 0)}</span>{" "}
                      <Link href={`/markets/${t.symbol}`} className="font-semibold hover:text-brand">
                        ${t.symbol}
                      </Link>{" "}
                      <span className="text-muted">@</span>{" "}
                      <span className="font-mono">{fmtCurrency(t.price)}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-slate-100">
                    {fmtCurrency(t.quantity * t.price)}
                  </p>
                  <p className="text-xs text-muted">{timeAgo(t.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
