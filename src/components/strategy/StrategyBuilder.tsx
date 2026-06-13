"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MiniChart from "@/components/ui/MiniChart";
import { useSession } from "@/components/auth/SessionProvider";
import type { BacktestResult, Strategy, StrategyRule } from "@/lib/strategy/engine";
import { UNIVERSE } from "@/lib/universe";
import { cn, fmtMoney, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// StrategyBuilder — compose a rule-based strategy, backtest it
// against 180 bars from the market provider, and (when signed in)
// save it as a simulated paper-automation strategy.
//
// Backtesting works in demo mode (mock market). Saving requires a
// Supabase session; otherwise we surface a friendly sign-in note.
// SIMULATED ONLY — no real broker is connected.
// ─────────────────────────────────────────────────────────────

type RuleKind = StrategyRule["kind"];

const ENTRY_KINDS: { kind: RuleKind; label: string; hint: string; unit: string }[] = [
  { kind: "pctDrop", label: "Buy the dip", hint: "Price falls ≥ X% vs. recent window", unit: "%" },
  { kind: "pctRise", label: "Momentum", hint: "Price rises ≥ X% vs. recent window", unit: "%" },
  { kind: "smaCross", label: "SMA cross", hint: "Close crosses above its X-bar SMA", unit: "bars" },
];

const EXIT_KINDS: { kind: RuleKind; label: string; unit: string }[] = [
  { kind: "takeProfit", label: "Take profit", unit: "%" },
  { kind: "stopLoss", label: "Stop loss", unit: "%" },
  { kind: "pctRise", label: "Exit on +move", unit: "%" },
  { kind: "pctDrop", label: "Exit on −move", unit: "%" },
];

// Group the universe by region for the symbol picker.
const SYMBOLS_BY_REGION = UNIVERSE.reduce<Record<string, typeof UNIVERSE>>((acc, u) => {
  (acc[u.region] ??= []).push(u);
  return acc;
}, {});

export default function StrategyBuilder() {
  const router = useRouter();
  const { user, configured } = useSession();

  const [name, setName] = useState("My strategy");
  const [symbol, setSymbol] = useState("AAPL");
  const [capital, setCapital] = useState("10000");
  const [interval, setInterval] = useState<"1d" | "1w">("1d");

  const [entryKind, setEntryKind] = useState<RuleKind>("pctDrop");
  const [entryValue, setEntryValue] = useState("5");
  const [exits, setExits] = useState<StrategyRule[]>([
    { kind: "takeProfit", value: 10 },
    { kind: "stopLoss", value: 5 },
  ]);

  const [automate, setAutomate] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [status, setStatus] = useState<
    | { kind: "idle" | "running" | "saving" }
    | { kind: "ok"; msg: string }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });

  function buildStrategy(): Strategy {
    return {
      name: name.trim() || `${symbol} strategy`,
      symbol,
      capital: Math.max(1, Number(capital) || 0),
      entry: { kind: entryKind, value: Number(entryValue) || 0 },
      exit: exits,
      interval,
    };
  }

  function updateExit(i: number, patch: Partial<StrategyRule>) {
    setExits((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  function addExit() {
    setExits((prev) => [...prev, { kind: "takeProfit", value: 10 }]);
  }

  function removeExit(i: number) {
    setExits((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function runBacktest() {
    setStatus({ kind: "running" });
    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backtest", strategy: buildStrategy() }),
      });
      const data = await res.json();
      if (!data.result) {
        setResult(null);
        setStatus({ kind: "error", msg: data.error ?? "Backtest failed." });
        return;
      }
      setResult(data.result as BacktestResult);
      setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error", msg: "Network error — try again." });
    }
  }

  async function save() {
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: buildStrategy(), automate }),
      });
      const data = await res.json();
      if (!data.ok) {
        setStatus({ kind: "error", msg: data.error ?? "Could not save." });
        return;
      }
      setStatus({
        kind: "ok",
        msg: automate
          ? "Saved — paper automation armed (simulated)."
          : "Strategy saved.",
      });
      router.refresh();
    } catch {
      setStatus({ kind: "error", msg: "Network error — try again." });
    }
  }

  const currency = UNIVERSE.find((u) => u.symbol === symbol)?.currency ?? "USD";
  const equityUp =
    result && result.equityCurve.length > 1
      ? result.equityCurve[result.equityCurve.length - 1] >= result.equityCurve[0]
      : true;
  const canSave = configured && Boolean(user);

  return (
    <div className="card p-4 sm:p-5">
      <h2 className="text-sm font-bold text-slate-200">Build a strategy</h2>
      <p className="mt-0.5 text-xs text-muted">
        Rule-based entries and exits, backtested on 180 bars. Save to run as simulated paper
        automation.
      </p>

      {/* ── Basics ─────────────────────────────────────────────── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input mt-1"
            placeholder="My strategy"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Symbol</span>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="input mt-1"
          >
            {Object.entries(SYMBOLS_BY_REGION).map(([region, list]) => (
              <optgroup key={region} label={region}>
                {list.map((u) => (
                  <option key={u.symbol} value={u.symbol}>
                    {u.symbol} — {u.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Capital ({currency})</span>
          <input
            type="number"
            min={1}
            step={100}
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            className="input mt-1 font-mono"
            inputMode="numeric"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Interval</span>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as "1d" | "1w")}
            className="input mt-1"
          >
            <option value="1d">Daily</option>
            <option value="1w">Weekly</option>
          </select>
        </label>
      </div>

      {/* ── Entry rule ─────────────────────────────────────────── */}
      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Entry</h3>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <select
            value={entryKind}
            onChange={(e) => setEntryKind(e.target.value as RuleKind)}
            className="input flex-1 min-w-[160px]"
          >
            {ENTRY_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step={1}
              value={entryValue}
              onChange={(e) => setEntryValue(e.target.value)}
              className="input w-24 font-mono"
              inputMode="numeric"
            />
            <span className="text-xs text-muted">
              {ENTRY_KINDS.find((k) => k.kind === entryKind)?.unit}
            </span>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {ENTRY_KINDS.find((k) => k.kind === entryKind)?.hint}
        </p>
      </div>

      {/* ── Exit rules ─────────────────────────────────────────── */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Exits</h3>
          <button onClick={addExit} className="btn-ghost text-xs">
            + Add exit
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {exits.length === 0 && (
            <p className="text-[11px] text-muted">
              No exit rule — the position closes on the last bar.
            </p>
          )}
          {exits.map((ex, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={ex.kind}
                onChange={(e) => updateExit(i, { kind: e.target.value as RuleKind })}
                className="input flex-1 min-w-[150px]"
              >
                {EXIT_KINDS.map((k) => (
                  <option key={k.kind} value={k.kind}>
                    {k.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step={1}
                  value={ex.value}
                  onChange={(e) => updateExit(i, { value: Number(e.target.value) || 0 })}
                  className="input w-24 font-mono"
                  inputMode="numeric"
                />
                <span className="text-xs text-muted">
                  {EXIT_KINDS.find((k) => k.kind === ex.kind)?.unit}
                </span>
              </div>
              <button
                onClick={() => removeExit(i)}
                className="link-muted text-xs hover:text-bear"
                aria-label="Remove exit rule"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={runBacktest}
          disabled={status.kind === "running"}
          className="btn-primary"
        >
          {status.kind === "running" ? "Backtesting…" : "Backtest"}
        </button>

        <label className="ml-1 flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={automate}
            onChange={(e) => setAutomate(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Automate (paper)
        </label>

        <button
          onClick={save}
          disabled={!canSave || status.kind === "saving"}
          className="btn-ghost"
          title={canSave ? undefined : "Sign in to save"}
        >
          {status.kind === "saving" ? "Saving…" : "Save strategy"}
        </button>
      </div>

      {!canSave && (
        <p className="mt-2 text-[11px] text-muted">
          {configured ? "Sign in to save and arm automation." : "Demo mode — saving is disabled."}{" "}
          Backtesting works either way.
        </p>
      )}

      {status.kind === "ok" && (
        <p className="mt-2 rounded-lg bg-bull/10 px-3 py-2 text-xs text-bull">{status.msg}</p>
      )}
      {status.kind === "error" && (
        <p className="mt-2 rounded-lg bg-bear/10 px-3 py-2 text-xs text-bear">{status.msg}</p>
      )}

      {/* ── Results ────────────────────────────────────────────── */}
      {result && (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Backtest — 180 bars
          </h3>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <Stat
              label="Return"
              value={fmtPct(result.returnPct)}
              tone={result.returnPct >= 0 ? "bull" : "bear"}
            />
            <Stat label="Round-trips" value={String(result.nTrades)} />
            <Stat label="Win rate" value={`${Math.round(result.winRate * 100)}%`} />
          </div>

          <div className="mt-4">
            <MiniChart data={result.equityCurve} up={equityUp} height={64} />
          </div>

          {result.trades.length > 0 ? (
            <div className="mt-4 max-h-56 overflow-y-auto rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-bg-soft text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Side</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.map((t, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-1.5 font-mono text-slate-300">{t.date}</td>
                      <td className="px-3 py-1.5">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-semibold capitalize",
                            t.side === "buy" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear",
                          )}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-200">
                        {fmtMoney(t.price, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">
              No trades triggered over the window — try loosening the entry rule.
            </p>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Backtest is a deterministic simulation on mock/live candles. Past performance does not
            predict future results.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "bull" | "bear";
}) {
  return (
    <div className="rounded-xl bg-bg-soft px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-mono text-base font-bold",
          tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-slate-100",
        )}
      >
        {value}
      </div>
    </div>
  );
}
