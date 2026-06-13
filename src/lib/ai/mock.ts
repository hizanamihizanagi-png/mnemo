import type { Insight, ModerationResult, Prediction, Sentiment } from "@/lib/types";
import { hashString, mulberry32 } from "@/lib/utils";
import { financeScore } from "./finance-lexicon";
import type { AIProvider, MarketContext } from "./types";

// ─────────────────────────────────────────────────────────────
// Mock AI provider.
//
// Produces plausible, deterministic insights & predictions from
// simple technical heuristics on the recent price series. No key
// required. The output shape is identical to the real providers
// so the UI never needs to branch.
// ─────────────────────────────────────────────────────────────

const DISCLAIMER =
  "AI-generated analysis for informational purposes only. Not financial advice. Markets are risky; do your own research.";

function trendOf(closes: number[]): { slopePct: number; sentiment: Sentiment } {
  if (closes.length < 2) return { slopePct: 0, sentiment: "neutral" };
  const first = closes[0];
  const last = closes[closes.length - 1];
  const slopePct = ((last - first) / first) * 100;
  const sentiment: Sentiment =
    slopePct > 1.5 ? "bullish" : slopePct < -1.5 ? "bearish" : "neutral";
  return { slopePct, sentiment };
}

function volatilityOf(closes: number[]): number {
  if (closes.length < 2) return 0;
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance =
    rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * 100;
}

const DRIVER_POOL = [
  "sector rotation into {sector}",
  "above-average trading volume",
  "improving relative strength vs. the broader market",
  "options flow skewing {dir}",
  "moving-average {cross} forming on the daily chart",
  "macro backdrop ({macro})",
  "recent {dir} momentum continuation",
  "narrowing trading range hinting at a breakout",
];

const MACRO_POOL = ["soft CPI print", "Fed policy expectations", "rate-cut odds shifting", "Treasury yields easing", "stronger jobs data"];

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export const mockAI: AIProvider = {
  name: "mock",

  async generateInsight(ctx: MarketContext): Promise<Insight> {
    const rand = mulberry32(
      hashString(ctx.symbol + ":" + Math.floor(Date.now() / 3_600_000)),
    );
    const { slopePct, sentiment } = trendOf(ctx.recentCloses);
    const vol = volatilityOf(ctx.recentCloses);

    const up = sentiment === "bearish" ? false : sentiment === "bullish" ? true : rand() > 0.5;
    const dir = up ? "up" : "down";
    const horizons: Prediction["horizon"][] = ["1d", "1w", "1m", "3m"];
    const horizon = pick(rand, horizons);

    // Forecasted move scales with realized volatility and horizon.
    const horizonMult = { "1d": 0.4, "1w": 1, "1m": 2.2, "3m": 4 }[horizon];
    const targetPct =
      (up ? 1 : -1) * Number((Math.max(0.6, vol) * horizonMult * (0.7 + rand() * 0.8)).toFixed(2));

    // Confidence: higher when trend is clear and volatility moderate.
    const trendStrength = Math.min(1, Math.abs(slopePct) / 8);
    const volPenalty = Math.min(0.4, vol / 20);
    const confidence = Number(
      Math.max(0.35, Math.min(0.92, 0.55 + trendStrength * 0.3 - volPenalty + (rand() - 0.5) * 0.1)).toFixed(2),
    );

    const drivers = Array.from({ length: 3 }, () =>
      pick(rand, DRIVER_POOL)
        .replace("{sector}", ctx.sector)
        .replace("{dir}", up ? "bullish" : "bearish")
        .replace("{cross}", up ? "golden cross" : "death cross")
        .replace("{macro}", pick(rand, MACRO_POOL)),
    );
    const uniqueDrivers = Array.from(new Set(drivers));

    const prediction: Prediction = {
      id: `pred_${ctx.symbol}_${Math.floor(Date.now() / 1000)}`,
      symbol: ctx.symbol,
      direction: dir,
      targetPct,
      confidence,
      horizon,
      rationale: `Over the recent window, ${ctx.symbol} has ${
        slopePct >= 0 ? "gained" : "shed"
      } ${Math.abs(slopePct).toFixed(1)}% with ${
        vol > 2.5 ? "elevated" : "contained"
      } volatility (~${vol.toFixed(1)}%/day). The setup leans ${
        up ? "constructive" : "cautious"
      } for a ${horizon} horizon.`,
      drivers: uniqueDrivers,
      risk: up
        ? "A broad-market risk-off move or disappointing guidance could invalidate the thesis."
        : "A positive catalyst or short-covering squeeze could reverse the downside view.",
      model: "mnemo-mock-quant",
      created_at: new Date().toISOString(),
    };

    const bullets = [
      `Trend: ${slopePct >= 0 ? "up" : "down"} ${Math.abs(slopePct).toFixed(1)}% over the recent window.`,
      `Volatility: ~${vol.toFixed(1)}% daily — ${vol > 2.5 ? "expect larger swings" : "relatively stable"}.`,
      `Bias: ${sentiment} into a ${horizon} horizon.`,
      `Sector: ${ctx.sector}.`,
    ];

    return {
      symbol: ctx.symbol,
      summary: `${ctx.name} (${ctx.symbol}) looks ${sentiment} near $${ctx.price.toFixed(
        2,
      )}. AI models a ${targetPct > 0 ? "+" : ""}${targetPct}% move over ${horizon} at ${(confidence * 100).toFixed(
        0,
      )}% confidence.`,
      sentiment,
      bullets,
      prediction,
      disclaimer: DISCLAIMER,
    };
  },

  async classifyTopic(text: string): Promise<ModerationResult> {
    const score = financeScore(text);
    const allowed = score >= 0.18;
    return {
      allowed,
      topicScore: score,
      reason: allowed
        ? "Finance-related content."
        : "Mnemo is for markets, stocks, and financial predictions only. Add tickers ($AAPL), market context, or a clear financial angle.",
    };
  },
};
