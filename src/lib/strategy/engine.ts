// ─────────────────────────────────────────────────────────────
// Strategy engine — a small, pure, dependency-free backtester.
//
// Models a single-symbol, long-only strategy over a candle series.
// The entry rule decides when to open a position; exit rules
// (take-profit / stop-loss and the inverse % move) decide when to
// close it. Equity is marked-to-market on every bar so we can draw
// an equity curve. Everything here is deterministic: the same
// strategy + candles always yields the same result.
// ─────────────────────────────────────────────────────────────

import type { Candle } from "@/lib/types";

export interface StrategyRule {
  // pctDrop / pctRise — move vs. a recent reference window (entry or exit).
  // smaCross        — price crosses above its simple moving average (entry).
  // stopLoss        — close the position after an adverse % move from entry.
  // takeProfit      — close the position after a favorable % move from entry.
  kind: "pctDrop" | "pctRise" | "smaCross" | "stopLoss" | "takeProfit";
  // Magnitude in percent (e.g. 5 = 5%). For smaCross the value is the
  // lookback window length in bars.
  value: number;
}

export interface Strategy {
  id?: string;
  name: string;
  symbol: string;
  capital: number;
  entry: StrategyRule;
  exit: StrategyRule[];
  interval: "1d" | "1w";
}

export interface BacktestResult {
  trades: { date: string; side: "buy" | "sell"; price: number }[];
  equityCurve: number[];
  returnPct: number;
  nTrades: number; // number of completed round-trips
  winRate: number; // 0..1 share of round-trips that closed profitably
}

// Window used by % move rules and the default SMA lookback.
const REFERENCE_WINDOW = 10;

// Format a unix-seconds timestamp as an ISO date (YYYY-MM-DD), stable
// across environments.
function isoDate(timeSec: number): string {
  return new Date(timeSec * 1000).toISOString().slice(0, 10);
}

// Simple moving average of the previous `len` closes ending at index i
// (inclusive). Returns null until there is enough history.
function smaAt(candles: Candle[], i: number, len: number): number | null {
  if (len <= 0 || i + 1 < len) return null;
  let sum = 0;
  for (let k = i - len + 1; k <= i; k++) sum += candles[k].close;
  return sum / len;
}

// Reference close `REFERENCE_WINDOW` bars back (clamped to the start),
// used to measure a recent % move for pctDrop / pctRise entries.
function referenceClose(candles: Candle[], i: number): number {
  const j = Math.max(0, i - REFERENCE_WINDOW);
  return candles[j].close;
}

// Does the entry rule trigger at bar i (with at least one prior bar)?
function entryTriggers(rule: StrategyRule, candles: Candle[], i: number): boolean {
  if (i < 1) return false;
  const close = candles[i].close;

  switch (rule.kind) {
    case "pctDrop": {
      // Price has fallen at least value% vs. the reference window — a dip to buy.
      const ref = referenceClose(candles, i);
      if (ref <= 0) return false;
      const movePct = ((close - ref) / ref) * 100;
      return movePct <= -Math.abs(rule.value);
    }
    case "pctRise": {
      // Momentum entry: price up at least value% vs. the reference window.
      const ref = referenceClose(candles, i);
      if (ref <= 0) return false;
      const movePct = ((close - ref) / ref) * 100;
      return movePct >= Math.abs(rule.value);
    }
    case "smaCross": {
      // Bullish cross: close crosses from below to above its SMA.
      const len = Math.max(2, Math.round(rule.value) || REFERENCE_WINDOW);
      const sma = smaAt(candles, i, len);
      const prevSma = smaAt(candles, i - 1, len);
      if (sma === null || prevSma === null) return false;
      const prevClose = candles[i - 1].close;
      return prevClose <= prevSma && close > sma;
    }
    default:
      // stopLoss / takeProfit are exit-only; never trigger an entry.
      return false;
  }
}

// Given the entry price and the current bar, does any exit rule fire?
// Returns the matched rule kind (for clarity) or null.
function exitTriggers(
  rules: StrategyRule[],
  entryPrice: number,
  candles: Candle[],
  i: number,
): "stopLoss" | "takeProfit" | "pctRise" | "pctDrop" | null {
  if (entryPrice <= 0) return null;
  const close = candles[i].close;
  const pnlPct = ((close - entryPrice) / entryPrice) * 100;

  for (const rule of rules) {
    const v = Math.abs(rule.value);
    switch (rule.kind) {
      case "takeProfit":
        if (pnlPct >= v) return "takeProfit";
        break;
      case "stopLoss":
        if (pnlPct <= -v) return "stopLoss";
        break;
      case "pctRise":
        // Exit into strength relative to the recent window.
        if (((close - referenceClose(candles, i)) / referenceClose(candles, i)) * 100 >= v)
          return "pctRise";
        break;
      case "pctDrop":
        if (((close - referenceClose(candles, i)) / referenceClose(candles, i)) * 100 <= -v)
          return "pctDrop";
        break;
      default:
        break;
    }
  }
  return null;
}

// Run the backtest. Long-only, fully-invested single position: when the
// entry fires we buy as many whole "units" as the capital allows at that
// bar's close, and exit the entire position when an exit rule fires.
export function backtest(strategy: Strategy, candles: Candle[]): BacktestResult {
  const startCapital = strategy.capital > 0 ? strategy.capital : 10000;

  // Not enough data to do anything meaningful — flat equity, no trades.
  if (!candles || candles.length < 2) {
    return {
      trades: [],
      equityCurve: candles && candles.length ? candles.map(() => startCapital) : [startCapital],
      returnPct: 0,
      nTrades: 0,
      winRate: 0,
    };
  }

  const trades: BacktestResult["trades"] = [];
  const equityCurve: number[] = [];

  let cash = startCapital;
  let units = 0; // fractional units held while in a position
  let entryPrice = 0;
  let wins = 0;
  let roundTrips = 0;

  for (let i = 0; i < candles.length; i++) {
    const bar = candles[i];

    if (units === 0) {
      // Flat — look for an entry.
      if (entryTriggers(strategy.entry, candles, i) && bar.close > 0) {
        units = cash / bar.close;
        entryPrice = bar.close;
        cash = 0;
        trades.push({ date: isoDate(bar.time), side: "buy", price: bar.close });
      }
    } else {
      // In a position — look for an exit.
      const fired = exitTriggers(strategy.exit, entryPrice, candles, i);
      const isLastBar = i === candles.length - 1;
      if (fired || isLastBar) {
        cash = units * bar.close;
        const won = bar.close > entryPrice;
        if (won) wins++;
        roundTrips++;
        trades.push({ date: isoDate(bar.time), side: "sell", price: bar.close });
        units = 0;
        entryPrice = 0;
      }
    }

    // Mark equity to market for the curve.
    const markValue = units > 0 ? units * bar.close : cash;
    equityCurve.push(markValue);
  }

  const finalEquity = equityCurve[equityCurve.length - 1] ?? startCapital;
  const returnPct = ((finalEquity - startCapital) / startCapital) * 100;
  const winRate = roundTrips > 0 ? wins / roundTrips : 0;

  return {
    trades,
    equityCurve,
    returnPct,
    nTrades: roundTrips,
    winRate,
  };
}
