import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAIProvider, type CopilotContext } from "@/lib/ai";
import { getMarketProvider } from "@/lib/market";
import { UNIVERSE } from "@/lib/universe";
import type { ChatMessage } from "@/lib/types";
import { extractCashtags } from "@/lib/utils";
import { getLeaderboard } from "@/lib/data/portfolio";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/copilot — free-form finance copilot chat.
//
// Body: { messages: ChatMessage[], model?: string }
//
// Builds a lightweight market context from any cashtags in the last
// user message plus a handful of US movers, asks the AI provider for a
// reply, and (best-effort) persists the exchange to copilot_messages
// when a Supabase session exists. Never 500s — any failure degrades to
// a friendly 200 reply so the dock stays usable in demo mode.
// ─────────────────────────────────────────────────────────────

interface CopilotBody {
  messages?: unknown;
  model?: unknown;
}

const FALLBACK = "(copilot indisponible)";

function isChatMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== "object") return false;
  const r = (m as { role?: unknown }).role;
  const c = (m as { content?: unknown }).content;
  return (r === "user" || r === "assistant" || r === "system") && typeof c === "string";
}

export async function POST(req: Request) {
  try {
    let payload: CopilotBody;
    try {
      payload = (await req.json()) as CopilotBody;
    } catch {
      return NextResponse.json({ reply: FALLBACK }, { status: 200 });
    }

    const messages: ChatMessage[] = Array.isArray(payload.messages)
      ? payload.messages.filter(isChatMessage)
      : [];
    if (messages.length === 0) {
      return NextResponse.json({ reply: FALLBACK }, { status: 200 });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastUserText = lastUser?.content ?? "";

    // Build market context: cashtags from the last user message, plus a
    // few US large caps as "top movers" reference. Tolerate provider errors.
    const ctx: CopilotContext = await buildContext(lastUserText);

    const reply = await getAIProvider().chat(messages, ctx);
    const replyText = typeof reply === "string" && reply.trim() ? reply : FALLBACK;

    // Best-effort persistence — never blocks the response, never throws.
    void persist(lastUserText, replyText, payload.model);

    return NextResponse.json({ reply: replyText }, { status: 200 });
  } catch {
    return NextResponse.json({ reply: FALLBACK }, { status: 200 });
  }
}

async function buildContext(lastUserText: string): Promise<CopilotContext> {
  try {
    const market = getMarketProvider();
    const cashtags = extractCashtags(lastUserText).map((s) => s.toUpperCase());
    const movers = UNIVERSE.filter((u) => u.region === "US")
      .slice(0, 8)
      .map((u) => u.symbol);
    // De-dupe: cashtags first (user intent), then movers as backdrop.
    const wanted = Array.from(new Set([...cashtags, ...movers]));
    const quotes = await market.getQuotes(wanted);
    const symbols = quotes.map((q) => ({
      symbol: q.symbol,
      price: q.price,
      changePct: q.changePct,
    }));

    // Fetch leaderboard standings (top 3)
    const leaderboardRows = await getLeaderboard(3).catch(() => []);
    const leaderboard = leaderboardRows.map((l) => ({
      handle: l.handle,
      display_name: l.display_name,
      returnPct: l.returnPct,
    }));

    // Fetch recent sentiment for parsed cashtags
    const sentiment: CopilotContext["sentiment"] = [];
    if (cashtags.length > 0) {
      const supabase = await getServerSupabase();
      if (supabase) {
        const { data: recentPosts } = await supabase
          .from("posts")
          .select("sentiment, cashtags")
          .order("created_at", { ascending: false })
          .limit(100);

        if (recentPosts) {
          for (const tag of cashtags) {
            let bullish = 0, bearish = 0, neutral = 0;
            for (const post of recentPosts) {
              const tags = Array.isArray(post.cashtags) ? post.cashtags : [];
              if (tags.some((t: string) => t.toUpperCase() === tag)) {
                if (post.sentiment === "bullish") bullish++;
                else if (post.sentiment === "bearish") bearish++;
                else neutral++;
              }
            }
            if (bullish > 0 || bearish > 0 || neutral > 0) {
              sentiment.push({ symbol: tag, bullish, bearish, neutral });
            }
          }
        }
      } else {
        const { getFeed } = await import("@/lib/data/feed");
        const feed = await getFeed();
        for (const tag of cashtags) {
          let bullish = 0, bearish = 0, neutral = 0;
          for (const post of feed) {
            if (post.cashtags.some((t) => t.toUpperCase() === tag)) {
              if (post.sentiment === "bullish") bullish++;
              else if (post.sentiment === "bearish") bearish++;
              else neutral++;
            }
          }
          if (bullish > 0 || bearish > 0 || neutral > 0) {
            sentiment.push({ symbol: tag, bullish, bearish, neutral });
          }
        }
      }
    }

    return { symbols, leaderboard, sentiment };
  } catch {
    return {};
  }
}

async function persist(userText: string, replyText: string, model: unknown) {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const modelId = typeof model === "string" && model ? model : "mnemo-mock";

    // Reuse the most recent thread for this user, or create one.
    let threadId: string | null = null;
    const { data: existing } = await supabase
      .from("copilot_threads")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    threadId = (existing as { id?: string } | null)?.id ?? null;

    if (!threadId) {
      const { data: created } = await supabase
        .from("copilot_threads")
        .insert({ user_id: user.id, model: modelId })
        .select("id")
        .single();
      threadId = (created as { id?: string } | null)?.id ?? null;
    }
    if (!threadId) return;

    await supabase.from("copilot_messages").insert([
      { thread_id: threadId, user_id: user.id, role: "user", content: userText },
      { thread_id: threadId, user_id: user.id, role: "assistant", content: replyText },
    ]);
    await supabase
      .from("copilot_threads")
      .update({ updated_at: new Date().toISOString(), model: modelId })
      .eq("id", threadId);
  } catch {
    // Ignore persistence failures — chat already succeeded.
  }
}
