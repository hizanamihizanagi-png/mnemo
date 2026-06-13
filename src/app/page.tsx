import Link from "next/link";
import HeroSceneClient from "@/components/three/HeroSceneClient";
import { getMarketProvider } from "@/lib/market";
import { UNIVERSE } from "@/lib/universe";
import { fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Landing page — the cinematic "3D website" front door. Public,
// no app shell. A procedural WebGL hero sits behind the value prop;
// a live (or mock) market strip proves the product is wired to data.
// ─────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const market = getMarketProvider();
  const quotes = await market.getQuotes(UNIVERSE.slice(0, 8).map((u) => u.symbol));

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 3D hero backdrop */}
      <div className="pointer-events-none absolute inset-0 h-[100svh]">
        <HeroSceneClient />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
      </div>

      {/* Top nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-bg shadow-glow">
            M
          </span>
          <span className="text-xl font-black tracking-tight">mnemo</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/home" className="link-muted hidden px-3 py-2 text-sm font-medium sm:block">
            Explore
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
      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <span className="chip border-brand/40 bg-brand/10 text-brand">
          Markets · AI predictions · paper trading
        </span>
        <h1 className="mt-6 text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          The social network
          <br />
          <span className="bg-gradient-to-r from-brand via-brand-glow to-bull bg-clip-text text-transparent">
            for markets.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-300 sm:text-xl">
          Share your thesis. Pressure-test it with AI-driven predictions. Then
          paper-trade your conviction — and let the leaderboard keep score.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary px-7 py-3 text-base shadow-glow">
            Start trading free →
          </Link>
          <Link href="/home" className="btn-ghost px-7 py-3 text-base">
            Browse the feed
          </Link>
        </div>

        {/* Live market strip */}
        {quotes.length > 0 && (
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-bg-card/60 px-6 py-4 backdrop-blur">
            {quotes.map((q) => {
              const up = q.changePct >= 0;
              return (
                <div key={q.symbol} className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-slate-200">{q.symbol}</span>
                  <span className="font-mono text-muted">${q.price.toFixed(2)}</span>
                  <span className={up ? "text-bull" : "text-bear"}>
                    {up ? "▲" : "▼"} {fmtPct(q.changePct)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card animate-fade-up p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">
          From hunch to track record
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative">
              <span className="text-5xl font-black text-line">{i + 1}</span>
              <h3 className="mt-2 text-lg font-bold text-slate-100">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28">
        <div className="card relative overflow-hidden p-10 text-center sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
          <h2 className="relative text-3xl font-black tracking-tight sm:text-4xl">
            Put your market view on the record.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-slate-300">
            Join Mnemo with $100,000 in virtual cash. No real money, no risk —
            just signal.
          </p>
          <Link href="/signup" className="btn-primary relative mt-7 inline-flex px-8 py-3 text-base shadow-glow">
            Create your account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-xs font-black text-bg">
              M
            </span>
            <span className="font-bold text-slate-300">mnemo</span>
          </div>
          <p className="text-center text-xs leading-relaxed">
            For education & simulation only. Not financial advice. Market data
            may be delayed or simulated.
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

const FEATURES = [
  {
    title: "Finance-only feed",
    body: "A community focused purely on markets. An AI topic guard keeps the noise out so every post is signal.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 17l5-5 4 4 8-9" /><path d="M21 7v5h-5" />
      </svg>
    ),
  },
  {
    title: "AI predictions",
    body: "Generate a structured forecast for any ticker — direction, target, confidence, drivers, and risks — in one click.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    ),
  },
  {
    title: "Paper trading",
    body: "Back your thesis with $100k of virtual cash. Positions mark to live prices; the leaderboard ranks real skill.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12h3M3 9h18" />
      </svg>
    ),
  },
];

const STEPS = [
  { title: "Post your insight", body: "Drop a take with $cashtags. Tag it bullish, bearish, or neutral." },
  { title: "Ask the AI", body: "Pull an instant prediction with rationale and risk on any symbol." },
  { title: "Trade & track", body: "Place simulated orders and watch your return climb the board." },
];
