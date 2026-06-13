import { geminiAI } from "./gemini";
import { mockAI } from "./mock";
import { openaiAI } from "./openai";
import type { AIProvider } from "./types";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const choice = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  if (choice === "gemini" && process.env.GEMINI_API_KEY) {
    cached = geminiAI;
  } else if (choice === "openai" && process.env.OPENAI_API_KEY) {
    cached = openaiAI;
  } else {
    cached = mockAI;
  }
  return cached;
}

export type { AIProvider, MarketContext } from "./types";
