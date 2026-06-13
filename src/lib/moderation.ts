import { getAIProvider } from "@/lib/ai";
import { financeScore } from "@/lib/ai/finance-lexicon";
import type { ModerationResult } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Mnemo Topic Guard.
//
// Enforces the "finance-only" rule for posts. Two-stage:
//   1. Fast heuristic lexicon score (always runs, key-free).
//   2. AI classifier for borderline cases (if a provider is set).
// ─────────────────────────────────────────────────────────────

const MIN_LENGTH = 2;

export async function moderatePost(body: string): Promise<ModerationResult> {
  const text = body.trim();
  if (text.length < MIN_LENGTH) {
    return { allowed: false, topicScore: 0, reason: "Post is empty." };
  }

  const heuristic = financeScore(text);

  // Confidently finance → allow without spending an AI call.
  if (heuristic >= 0.45) {
    return { allowed: true, topicScore: heuristic, reason: "Finance-related content." };
  }

  // Confidently off-topic AND no strong signal → reject early.
  // (Borderline range is delegated to the AI classifier.)
  const ai = getAIProvider();
  const verdict = await ai.classifyTopic(text);
  return verdict;
}
