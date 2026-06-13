import Link from "next/link";
import { STARTING_CASH } from "@/lib/trading/engine";
import { fmtCurrency } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// PortfolioEmpty — friendly state for the portfolio page when no
// paper account is available: demo mode (Supabase not connected)
// or signed-out. Explains the simulation and links to sign up.
// ─────────────────────────────────────────────────────────────

export default function PortfolioEmpty() {
  return (
    <section className="card relative overflow-hidden p-8 text-center sm:p-12">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />

      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M16 12h3M3 9h18" />
        </svg>
      </div>

      <h2 className="relative mt-5 text-2xl font-black tracking-tight text-slate-100">
        Start a paper account
      </h2>
      <p className="relative mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted">
        Connect Supabase and sign in to open a real paper-trading account with{" "}
        <span className="font-semibold text-slate-200">{fmtCurrency(STARTING_CASH)}</span> of virtual
        cash. Place simulated orders, mark positions to live prices, and climb the leaderboard. No
        real money, no risk.
      </p>

      <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/signup" className="btn-primary px-6 py-2.5 shadow-glow">
          Create your account →
        </Link>
        <Link href="/markets" className="btn-ghost px-6 py-2.5">
          Browse markets
        </Link>
      </div>

      {/* Sample preview so the page never feels empty. */}
      <div className="relative mt-9 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line text-left">
        <SamplePreview label="Equity" value={fmtCurrency(STARTING_CASH)} />
        <SamplePreview label="Cash" value={fmtCurrency(STARTING_CASH)} />
        <SamplePreview label="Total return" value="+0.00%" />
      </div>
      <p className="relative mt-3 text-[11px] text-muted">Sample preview — simulated values.</p>
    </section>
  );
}

function SamplePreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold text-slate-300">{value}</p>
    </div>
  );
}
