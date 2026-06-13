import type { ChatMessage, Insight, ModerationResult } from "@/lib/types";
import { mockAI } from "./mock";
import { financeScore } from "./finance-lexicon";
import type { AIProvider, CopilotContext, MarketContext } from "./types";
import {
  buildChatSystemPrompt,
  buildInsightPrompt,
  buildTopicPrompt,
  parseInsight,
  parseTopic,
} from "./prompt";

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

  async chat(messages: ChatMessage[], ctx?: CopilotContext): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return mockAI.chat(messages, ctx);
    // Map the conversation to Gemini's contents. The system persona is
    // delivered as a leading user turn (Gemini's generateContent has no
    // dedicated system role on the v1beta endpoint); system messages in
    // the history are folded into user turns. assistant -> "model".
    const contents = [
      { role: "user", parts: [{ text: buildChatSystemPrompt(ctx) }] },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
        }),
      });
      if (!res.ok) return mockAI.chat(messages, ctx);
      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text && text.trim() ? text : mockAI.chat(messages, ctx);
    } catch {
      return mockAI.chat(messages, ctx);
    }
  },
};
