import type { EventMarket } from "@/lib/predmarkets";
import { fmtCompact } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// EventCard — a single binary prediction market tile.
//
// Renders the question, category + region chips, a Yes/No price
// bar (Yes ¢XX / No ¢YY where YY = round((1 - yesPrice) * 100)),
// the simulated volume and close date, plus a DISABLED trade
// button (real trading lands when Kalshi / Polymarket connect).
// Pure presentational — no client interactivity needed.
// ─────────────────────────────────────────────────────────────

function closeLabel(iso: string): string {
  const date = new Date(iso);
  const days = Math.max(0, Math.round((date.getTime() - Date.now()) / 86_400_000));
  const when = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${when} · ${days}j`;
}

export default function EventCard({ market }: { market: EventMarket }) {
  const yesCents = Math.round(market.yesPrice * 100);
  const noCents = Math.round((1 - market.yesPrice) * 100);
  const yesPct = Math.round(market.yesPrice * 100);

  return (
    <article className="card flex flex-col gap-4 p-4">
      {/* Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{market.category}</span>
        <span className="chip">{market.region}</span>
      </div>

      {/* Question */}
      <h3 className="text-base font-bold leading-snug text-slate-100">
        {market.question}
      </h3>

      {/* Yes/No price bar */}
      <div>
        <div className="flex h-7 w-full overflow-hidden rounded-lg border border-line">
          <div
            className="flex items-center justify-start bg-bull/25 px-2 text-xs font-bold text-bull"
            style={{ width: `${yesPct}%` }}
          >
            {yesPct >= 24 && `Yes ¢${yesCents}`}
          </div>
          <div className="flex flex-1 items-center justify-end bg-bear/20 px-2 text-xs font-bold text-bear">
            {yesPct <= 76 && `No ¢${noCents}`}
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-muted">
          <span className="text-bull">Yes ¢{yesCents}</span>
          <span className="text-bear">No ¢{noCents}</span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Volume{" "}
          <span className="font-mono text-slate-300">${fmtCompact(market.volume)}</span>
        </span>
        <span>Clôture {closeLabel(market.closeAt)}</span>
      </div>

      {/* Disabled trade action */}
      <div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Trading désactivé — intégration Kalshi / Polymarket à venir"
          className="btn w-full border border-line text-muted"
        >
          Trader (connecter Kalshi / Polymarket)
        </button>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          Trading non disponible — connexion Kalshi / Polymarket bientôt. Simulation
          pour l&apos;instant.
        </p>
      </div>
    </article>
  );
}
