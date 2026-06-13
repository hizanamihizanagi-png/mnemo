import type { Insight, ModerationResult, Prediction, Sentiment } from "@/lib/types";
import { clamp } from "@/lib/utils";
import type { MarketContext } from "./types";

const DISCLAIMER =
  "AI-generated analysis for informational purposes only. Not financial advice. Markets are risky; do your own research.";

// ── Prompt builders ────────────────────────────────────────────

export function buildInsightPrompt(ctx: MarketContext): string {
  return `You are a markets analyst. Analyze the stock below and return a JSON object.

Ticker: ${ctx.symbol}
Company: ${ctx.name}
Sector: ${ctx.sector}
Current price: $${ctx.price.toFixed(2)}
Today change: ${ctx.changePct.toFixed(2)}%
Recent closes (old→new): ${ctx.recentCloses.map((c) => c.toFixed(2)).join(", ")}

Return ONLY this JSON shape (no markdown, no commentary):
{
  "summary": "one or two sentence plain-English read",
  "sentiment": "bullish" | "bearish" | "neutral",
  "bullets": ["3-5 short factual observations"],
  "direction": "up" | "down",
  "targetPct": number (forecast % move over the horizon, signed),
  "confidence": number (0..1),
  "horizon": "1d" | "1w" | "1m" | "3m",
  "rationale": "why the model leans this way",
  "drivers": ["2-4 short catalysts"],
  "risk": "the main thing that would invalidate the view"
}
Rules: be specific to this ticker; never give personalized advice; frame as informational analysis only.`;
}

export function buildTopicPrompt(text: string): string {
  return `Mnemo is a social network exclusively about finance: stocks, markets, trading, crypto, macro/economics, predictions, and company fundamentals.

Decide if the following post belongs on Mnemo. Return ONLY JSON:
{ "allowed": boolean, "topicScore": number (0..1, how finance-related), "reason": "short user-facing explanation" }

Post: """${text.slice(0, 600)}"""`;
}

// ── Parsers (tolerant of fenced code blocks / stray text) ──────

function extractJson(raw: string): any | null {
  let s = raw.trim();
  // Strip ```json fences if present.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Otherwise grab the outermost {...}.
  if (!s.startsWith("{")) {
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first === -1 || last === -1) return null;
    s = s.slice(first, last + 1);
  }
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

const SENTIMENTS: Sentiment[] = ["bullish", "bearish", "neutral"];
const HORIZONS: Prediction["horizon"][] = ["1d", "1w", "1m", "3m"];

export function parseInsight(raw: string, ctx: MarketContext): Insight | null {
  const j = extractJson(raw);
  if (!j || typeof j !== "object") return null;

  const sentiment: Sentiment = SENTIMENTS.includes(j.sentiment) ? j.sentiment : "neutral";
  const direction: "up" | "down" = j.direction === "down" ? "down" : "up";
  const horizon = HORIZONS.includes(j.horizon) ? j.horizon : "1w";
  const confidence = clamp(Number(j.confidence) || 0.5, 0.05, 0.98);
  const targetPct = Number(j.targetPct);

  const prediction: Prediction = {
    id: `pred_${ctx.symbol}_${Math.floor(Date.now() / 1000)}`,
    symbol: ctx.symbol,
    direction,
    targetPct: Number.isFinite(targetPct) ? Number(targetPct.toFixed(2)) : 0,
    confidence: Number(confidence.toFixed(2)),
    horizon,
    rationale: String(j.rationale ?? "").slice(0, 600) || "Model rationale unavailable.",
    drivers: Array.isArray(j.drivers) ? j.drivers.slice(0, 4).map(String) : [],
    risk: String(j.risk ?? "").slice(0, 400) || "General market risk applies.",
    model: process.env.AI_PROVIDER === "openai" ? "openai" : "gemini",
    created_at: new Date().toISOString(),
  };

  return {
    symbol: ctx.symbol,
    summary: String(j.summary ?? "").slice(0, 400) || `${ctx.name} analysis.`,
    sentiment,
    bullets: Array.isArray(j.bullets) ? j.bullets.slice(0, 5).map(String) : [],
    prediction,
    disclaimer: DISCLAIMER,
  };
}

export function parseTopic(raw: string): ModerationResult | null {
  const j = extractJson(raw);
  if (!j || typeof j !== "object") return null;
  const topicScore = clamp(Number(j.topicScore) || 0, 0, 1);
  return {
    allowed: Boolean(j.allowed),
    topicScore,
    reason:
      String(j.reason ?? "").slice(0, 240) ||
      (j.allowed ? "Finance-related content." : "Mnemo is for finance and markets only."),
  };
}
