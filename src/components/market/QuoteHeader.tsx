import type { Quote } from "@/lib/types";
import { cn, fmtCompact, fmtMoney, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// QuoteHeader — the masthead of a symbol detail page.
//
// Big mono price, name/symbol, colored change, and a compact stats
// grid (Open / High / Low / Prev Close / Mkt Cap / Sector). Server
// component — purely presentational, no interactivity.
// ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg-soft/60 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}

export default function QuoteHeader({ quote }: { quote: Quote }) {
  const up = quote.changePct >= 0;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">{quote.symbol}</h1>
            <span className="chip border-brand/30 bg-brand/10 text-brand">{quote.sector}</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted">{quote.name}</p>
        </div>

        <div className="text-right">
          <p className="font-mono text-3xl font-bold leading-none text-slate-100">
            {fmtMoney(quote.price, quote.currency)}
          </p>
          <p className={cn("mt-1.5 font-mono text-sm font-semibold", up ? "text-bull" : "text-bear")}>
            {up ? "▲" : "▼"} {fmtMoney(Math.abs(quote.change), quote.currency)} ({fmtPct(quote.changePct)})
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Open" value={fmtMoney(quote.open, quote.currency)} />
        <Stat label="High" value={fmtMoney(quote.high, quote.currency)} />
        <Stat label="Low" value={fmtMoney(quote.low, quote.currency)} />
        <Stat label="Prev Close" value={fmtMoney(quote.prevClose, quote.currency)} />
        <Stat
          label="Mkt Cap"
          value={quote.marketCap ? `${fmtCompact(quote.marketCap)} ${quote.currency}` : "—"}
        />
        <Stat label="Currency" value={quote.currency} />
      </div>
    </div>
  );
}
