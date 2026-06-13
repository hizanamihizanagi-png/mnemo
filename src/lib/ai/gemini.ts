import type { Insight, ModerationResult } from "@/lib/types";
import { mockAI } from "./mock";
import { financeScore } from "./finance-lexicon";
import type { AIProvider, MarketContext } from "./types";
import { buildInsightPrompt, buildTopicPrompt, parseInsight, parseTopic } from "./prompt";

// ─────────────────────────────────────────────────────────────
// Google Gemini adapter (REST, no SDK dependency).
// Chosen for its strong cost/capability ratio. Falls back to the
// mock provider on any error so the product never hard-fails.
// ─────────────────────────────────────────────────────────────

function model(): string {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

async function callGemini(prompt: string, jsonMode: boolean): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 900,
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ?? null;
  } catch {
    return null;
  }
}

export const geminiAI: AIProvider = {
  name: "gemini",

  async generateInsight(ctx: MarketContext): Promise<Insight> {
    const raw = await callGemini(buildInsightPrompt(ctx), true);
    const parsed = raw ? parseInsight(raw, ctx) : null;
    return parsed ?? mockAI.generateInsight(ctx);
  },

  async classifyTopic(text: string): Promise<ModerationResult> {
    // Cheap pre-filter first; only call the model on borderline text.
    const heuristic = financeScore(text);
    if (heuristic >= 0.5) {
      return { allowed: true, topicScore: heuristic, reason: "Finance-related content." };
    }
    const raw = await callGemini(buildTopicPrompt(text), true);
    const parsed = raw ? parseTopic(raw) : null;
    return parsed ?? mockAI.classifyTopic(text);
  },
};
