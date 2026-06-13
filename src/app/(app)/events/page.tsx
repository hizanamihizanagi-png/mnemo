import { getEventMarkets } from "@/lib/predmarkets";
import EventCard from "@/components/events/EventCard";

// ─────────────────────────────────────────────────────────────
// Events — predictive (binary) markets surface.
//
// Kalshi / Polymarket-style finance & macro questions, fully
// simulated for now. Deterministic in demo mode (no env needed).
// SIMULATED ONLY — not financial advice.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const markets = getEventMarkets();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Marchés prédictifs</h1>
        <p className="mt-1 text-sm text-muted">
          Pariez (en simulation) sur l&apos;issue de questions macro & marchés à
          travers les régions.
        </p>
      </header>

      {/* "Coming soon" banner */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-slate-200">
        <span aria-hidden className="mt-0.5 text-base">🔮</span>
        <p className="leading-relaxed">
          Bientôt connecté à <span className="font-semibold">Kalshi</span> &{" "}
          <span className="font-semibold">Polymarket</span> — simulation pour
          l&apos;instant.
        </p>
      </div>

      {/* Responsive grid of event markets */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {markets.map((m) => (
          <EventCard key={m.id} market={m} />
        ))}
      </div>

      <p className="mt-6 px-1 text-xs leading-relaxed text-muted">
        Prix et volumes simulés à des fins éducatives et de démonstration
        uniquement — pas un conseil financier.
      </p>
    </div>
  );
}
