import type { ChatMessage, Insight, ModerationResult } from "@/lib/types";

export interface MarketContext {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  sector: string;
  // Recent closing prices, oldest → newest, for trend context.
  recentCloses: number[];
}

// Lightweight market context attached to a copilot conversation.
export interface CopilotContext {
  symbols?: { symbol: string; price: number; changePct: number }[];
  note?: string;
}

export interface AIProvider {
  name: string;
  // Generate a structured insight + prediction for a ticker.
  generateInsight(ctx: MarketContext): Promise<Insight>;
  // Classify whether free-text content is finance/markets related.
  classifyTopic(text: string): Promise<ModerationResult>;
  // Free-form finance-copilot chat. Returns the assistant reply text.
  chat(messages: ChatMessage[], ctx?: CopilotContext): Promise<string>;
}
