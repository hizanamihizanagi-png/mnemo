import type { Portfolio } from "@/lib/types";
import { cn, fmtCurrency, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// PortfolioSummary — hero card for the paper-trading account.
//
// Shows total equity (marked to market), total return in $ and %
// (colored bull/bear), and a stat row of cash, invested capital,
// and the original starting cash. Server component. SIMULATED ONLY.
// ─────────────────────────────────────────────────────────────

export default function PortfolioSummary({ portfolio }: { portfolio: Portfolio }) {
  const up = portfolio.totalReturn >= 0;
  const invested = portfolio.equity - portfolio.cash;

  return (
    <section className="card p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Account equity
      </p>
      <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
        <h2 className="font-mono text-4xl font-black tracking-tight text-slate-100 sm:text-5xl">
          {fmtCurrency(portfolio.equity)}
        </h2>
        <p className={cn("pb-1 font-mono text-base font-semibold", up ? "text-bull" : "text-bear")}>
          {up ? "▲" : "▼"} {fmtCurrency(portfolio.totalReturn)} ({fmtPct(portfolio.totalReturnPct)})
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
        <Stat label="Cash" value={fmtCurrency(portfolio.cash)} />
        <Stat label="Invested" value={fmtCurrency(invested)} />
        <Stat label="Starting cash" value={fmtCurrency(portfolio.startingCash)} muted />
      </dl>
    </section>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="bg-bg-card p-4">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className={cn("mt-1 font-mono text-lg font-semibold", muted ? "text-slate-300" : "text-slate-100")}>
        {value}
      </dd>
    </div>
  );
}
