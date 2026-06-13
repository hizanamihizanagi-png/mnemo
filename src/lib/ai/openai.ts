import type { ChatMessage, Insight, ModerationResult } from "@/lib/types";
import { mockAI } from "./mock";
import { financeScore } from "./finance-lexicon";
import type { AIProvider, CopilotContext, MarketContext } from "./types";
import { buildInsightPrompt, buildTopicPrompt, parseInsight, parseTopic } from "./prompt";

// ─────────────────────────────────────────────────────────────
// OpenAI adapter (Chat Completions, REST). Alternative to Gemini.
// Falls back to mock on any error.
// ─────────────────────────────────────────────────────────────

function model(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

async function callOpenAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model(),
        temperature: 0.7,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are Mnemo's financial analysis engine. Respond ONLY with valid JSON matching the requested schema. Never give individualized financial advice; frame everything as informational analysis.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export const openaiAI: AIProvider = {
  name: "openai",

  async generateInsight(ctx: MarketContext): Promise<Insight> {
    const raw = await callOpenAI(buildInsightPrompt(ctx));
    const parsed = raw ? parseInsight(raw, ctx) : null;
    return parsed ?? mockAI.generateInsight(ctx);
  },

  async classifyTopic(text: string): Promise<ModerationResult> {
    const heuristic = financeScore(text);
    if (heuristic >= 0.5) {
      return { allowed: true, topicScore: heuristic, reason: "Finance-related content." };
    }
    const raw = await callOpenAI(buildTopicPrompt(text));
    const parsed = raw ? parseTopic(raw) : null;
    return parsed ?? mockAI.classifyTopic(text);
  },

  // Copilot chat is not yet wired to OpenAI; delegate to the mock so the
  // provider still satisfies the AIProvider interface.
  async chat(messages: ChatMessage[], ctx?: CopilotContext): Promise<string> {
    return mockAI.chat(messages, ctx);
  },
};
