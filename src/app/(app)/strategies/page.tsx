import StrategyBuilder from "@/components/strategy/StrategyBuilder";
import StrategyList from "@/components/strategy/StrategyList";

// ─────────────────────────────────────────────────────────────
// Strategies — build rule-based entries/exits, backtest them on
// 180 bars, and save as simulated paper automation. Works in demo
// mode (mock market backtests; example strategies in the list).
// SIMULATED ONLY — no real broker is connected.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default function StrategiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">Strategies</h1>
        <p className="mt-0.5 text-sm text-muted">
          Design a rule-based strategy, backtest it on historical candles, and arm it as simulated
          paper automation. Real-broker execution comes later.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <StrategyBuilder />
        <StrategyList />
      </div>
    </div>
  );
}
