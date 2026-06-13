import type { ChatModel } from "@/lib/types";
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

// Chat models surfaced to the copilot model picker.
export const AI_MODELS: ChatModel[] = [
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "gemini",
    available: Boolean(process.env.GEMINI_API_KEY),
  },
  { id: "mnemo-mock", label: "Mnemo Mock", provider: "mock", available: true },
];

export function listModels(): ChatModel[] {
  return AI_MODELS;
}

export type { AIProvider, CopilotContext, MarketContext } from "./types";
