import Link from "next/link";
import HeroSceneClient from "@/components/three/HeroSceneClient";
import ReputationBadge from "@/components/social/ReputationBadge";
import { demoTrackRecord } from "@/lib/reputation";
import { getMarketProvider } from "@/lib/market";
import { UNIVERSE } from "@/lib/universe";
import { fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Landing page — the public front door. Restrained and editorial:
// one quiet 3D market-surface motif behind a typographic hero, a
// live market strip + a verifiable track-record card as proof, and
// the four pillars (Research · Proof · Practice · Terminal).
// ─────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const market = getMarketProvider();
  const quotes = await market.getQuotes(UNIVERSE.slice(0, 8).map((u) => u.symbol));
  // A deterministic demo résumé to make the "Proof" pillar tangible.
  const record = demoTrackRecord("amara");

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Quiet 3D market-surface backdrop */}
      <div className="pointer-events-none absolute inset-0 h-[100svh]">
        <HeroSceneClient />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/50 to-bg" />
      </div>

      {/* Top nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-display text-lg leading-none text-bg">
            M
          </span>
          <span className="font-display text-2xl leading-none tracking-tight">mnemo</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/markets" className="link-muted hidden px-3 py-2 text-sm font-medium sm:block">
            Markets
          </Link>
          <Link href="/login" className="btn-ghost text-sm">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Join Mnemo
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-16 text-center sm:pt-24">
        <span className="eyebrow rounded-full border border-line bg-bg-card/60 px-3 py-1 backdrop-blur">
          Research · Proof · Practice · Terminal
        </span>
        <h1 className="mt-7 text-balance font-display text-5xl leading-[1.04] tracking-tight sm:text-7xl">
          Where market opinions
          <br />
          become <span className="text-brand">verified track records.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-300 sm:text-xl">
          Yahoo Finance informs. Mnemo qualifies conviction. Research any market,
          log your calls, and let a public record prove you know what you&apos;re
          doing — global indices and Africa&apos;s emerging markets alike.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary px-7 py-3 text-base">
            Start free →
          </Link>
          <Link href="/leaderboard" className="btn-ghost px-7 py-3 text-base">
            See a track record
          </Link>
        </div>

        {/* Live market strip — proof the product is wired to data */}
        {quotes.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-bg-card/60 px-6 py-4 backdrop-blur">
            {quotes.map((q) => {
              const up = q.changePct >= 0;
              return (
                <div key={q.symbol} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-200">{q.symbol}</span>
                  <span className="font-mono text-muted">${q.price.toFixed(2)}</span>
                  <span className={`font-mono ${up ? "text-bull" : "text-bear"}`}>
                    {up ? "▲" : "▼"} {fmtPct(q.changePct)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Proof card — the wedge, made tangible */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <div className="card overflow-hidden p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-elevated font-display text-lg text-slate-100">
              A
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100">Amara Diallo</span>
                <ReputationBadge tier={record.tier} accuracy={record.accuracy} size="sm" />
              </div>
              <p className="text-xs text-muted">@amara · verified track record</p>
            </div>
            <span className="ml-auto eyebrow">Live example</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Accuracy" value={`${Math.round(record.accuracy * 100)}%`} tone="up" />
            <Stat label="Alpha" value={fmtPct(record.alpha)} tone={record.alpha >= 0 ? "up" : "down"} />
            <Stat label="Predictions" value={String(record.nPredictions)} />
            <Stat label="Resolved" value={String(record.nResolved)} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Every call is logged with an entry, a target, and a timeline. When it
            resolves, the score updates — in public. No screenshots, no
            cherry-picking. Just the record.
          </p>
        </div>
      </section>

      {/* The four pillars */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <p className="eyebrow text-center">The product kernel</p>
        <h2 className="mt-2 text-center font-display text-3xl tracking-tight sm:text-4xl">
          Four workflows, sharpened
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((f) => (
            <div key={f.title} className="card animate-fade-up p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-bg-soft text-brand">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg text-slate-100">{f.title}</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-brand/80">
                {f.outcome}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-center font-display text-3xl tracking-tight sm:text-4xl">
          From opinion to proof
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative">
              <span className="font-mono text-4xl font-bold text-line">0{i + 1}</span>
              <h3 className="mt-2 font-display text-lg text-slate-100">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28">
        <div className="card p-10 text-center sm:p-14">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Put your market view on the record.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Join with $100,000 in virtual cash. No real money, no risk — just
            signal, scored over time.
          </p>
          <Link href="/signup" className="btn-primary mt-7 inline-flex px-8 py-3 text-base">
            Create your account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand font-display text-xs text-bg">
              M
            </span>
            <span className="font-display text-base text-slate-300">mnemo</span>
          </div>
          <p className="text-center text-xs leading-relaxed">
            For education &amp; simulation only. Not financial advice. Reputation is
            platform-calculated, not audited. Market data may be delayed or simulated.
          </p>
          <div className="flex gap-4">
            <Link href="/home" className="link-muted">Feed</Link>
            <Link href="/markets" className="link-muted">Markets</Link>
            <Link href="/leaderboard" className="link-muted">Leaderboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-line bg-bg-soft/60 p-3 text-center">
      <p
        className={
          "font-mono text-xl font-bold " +
          (tone === "up" ? "text-bull" : tone === "down" ? "text-bear" : "text-slate-100")
        }
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

const PILLARS = [
  {
    title: "Research",
    outcome: "Understand",
    body: "AI investment memos, news & risk radar, social signals — including BRVM, JSE, NGX and EGX emerging markets.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
      </svg>
    ),
  },
  {
    title: "Proof",
    outcome: "Prove",
    body: "A prediction ledger with entry, target and timeline. Your profile becomes a shareable financial résumé.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12.5l2 2 4-4.5" /><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z" />
      </svg>
    ),
  },
  {
    title: "Practice",
    outcome: "Practice",
    body: "Paper-trade with $100k, build no-code strategies, backtest them, and enter challenges before risking real money.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12h3M3 9h18" />
      </svg>
    ),
  },
  {
    title: "Terminal",
    outcome: "Speed",
    body: "One command console: ask the market anything, pull memos, compare analysts and run backtests at speed.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" />
      </svg>
    ),
  },
];

const STEPS = [
  { title: "Research", body: "Read the AI memo, scan the signals and the risk radar for any asset or region." },
  { title: "Call it", body: "Post your thesis with a direction, a price target and a timeline. It goes on the ledger." },
  { title: "Prove it", body: "When the call resolves, your accuracy, alpha and reputation update — publicly." },
];
