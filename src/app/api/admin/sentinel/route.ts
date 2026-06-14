import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { getMarketProvider } from "@/lib/market";
import { UNIVERSE } from "@/lib/universe";
import type { ChatMessage, Sentiment, Post, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// POST /api/admin/sentinel — trigger an automated market briefing.
//
// Checks if the AI Research Bot account exists, generates a high-quality
// research post about the current market status, and writes it to
// the feed (database in live mode, in-memory array in demo mode).
// ─────────────────────────────────────────────────────────────

const AI_RESEARCH_BOT_PROFILE: Profile = {
  id: "demo-research-bot",
  handle: "researchbot",
  display_name: "AI Research Bot",
  bio: "Automated market briefings and quantitative reports. Simulated only.",
  avatar_url: null,
  created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
};

export async function POST(req: Request) {
  try {
    const market = getMarketProvider();
    const indices = await market.getIndices().catch(() => []);
    const usQuotes = await market.getQuotes(["AAPL", "MSFT", "NVDA", "AMZN", "TSLA"]).catch(() => []);
    const regionalQuotes = await market.getQuotes(["$BRVMc", "$JSE", "$BVMAC"]).catch(() => []);

    // Format current market context for the AI model
    const indicesCtx = indices.map(i => `${i.symbol}: ${i.value} (${i.changePct >= 0 ? "+" : ""}${i.changePct.toFixed(2)}%)`).join(", ");
    const usCtx = usQuotes.map(q => `${q.symbol}: $${q.price.toFixed(2)} (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%)`).join(", ");
    const regionalCtx = regionalQuotes.map(q => `${q.symbol}: ${q.price.toFixed(2)} (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%)`).join(", ");

    const promptText = `
      Write a short, engaging, and professional market summary post for Mnemo.
      It should look like a real quantitative analyst's brief update (maximum 450 characters).
      Mention 2-3 tickers using $ (e.g. $AAPL, $NVDA, $BRVMc).
      Pick a sentiment: 'bullish', 'bearish', or 'neutral'.
      Provide ONLY a JSON object in this format (no markdown, no other text):
      {
        "body": "Your short analysis post text...",
        "sentiment": "bullish" | "bearish" | "neutral",
        "cashtags": ["AAPL", "NVDA", "BRVMc"]
      }

      Here is the current live market state for context:
      Indices: ${indicesCtx}
      US Tech Large Caps: ${usCtx}
      Emerging Indices: ${regionalCtx}
    `;

    const messages: ChatMessage[] = [
      { role: "system", content: "You are a professional financial market bot that writes daily brief updates for Mnemo. Label your accounts clearly as AI Research Bot." },
      { role: "user", content: promptText }
    ];

    const reply = await getAIProvider().chat(messages);

    let postBody = "Markets are showing mixed sentiment today with tech large caps leading indices slightly higher. Emerging markets remain steady.";
    let postSentiment: Sentiment = "neutral";
    let postCashtags: string[] = ["AAPL", "BRVMc"];

    try {
      let cleanReply = reply.trim();
      const fence = cleanReply.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fence) cleanReply = fence[1].trim();
      const parsed = JSON.parse(cleanReply);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.body === "string" && parsed.body.trim()) {
          postBody = parsed.body.trim();
        }
        if (["bullish", "bearish", "neutral"].includes(parsed.sentiment)) {
          postSentiment = parsed.sentiment;
        }
        if (Array.isArray(parsed.cashtags)) {
          postCashtags = parsed.cashtags.map((t: string) => String(t).toUpperCase().replace("$", ""));
        }
      }
    } catch (e) {
      // JSON parse failed, use default fallbacks
    }

    const admin = await getAdminSupabase();
    if (admin) {
      // LIVE MODE: Persist to Supabase
      let botUserId: string | null = null;
      
      // Look up existing profile
      const { data: existingProf } = await admin
        .from("profiles")
        .select("id")
        .eq("handle", "researchbot")
        .maybeSingle();

      if (existingProf) {
        botUserId = existingProf.id;
      } else {
        // Create auth user for bot
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: "sentinel@mnemo.ai",
          email_confirm: true,
          user_metadata: {
            handle: "researchbot",
            display_name: "AI Research Bot"
          }
        });

        if (createError) {
          // If already exists, list users to resolve ID
          const { data: users } = await admin.auth.admin.listUsers();
          const found = users?.users?.find(u => u.email === "sentinel@mnemo.ai");
          if (found) {
            botUserId = found.id;
            // Seed profile entry
            await admin.from("profiles").insert({
              id: botUserId,
              handle: "researchbot",
              display_name: "AI Research Bot",
              bio: "Automated market briefings and quantitative reports. Simulated only."
            }).select().maybeSingle();
          }
        } else if (newUser?.user) {
          botUserId = newUser.user.id;
          await admin.from("profiles").update({
            bio: "Automated market briefings and quantitative reports. Simulated only."
          }).eq("id", botUserId);
        }
      }

      if (!botUserId) {
        return NextResponse.json({ error: "Could not resolve AI bot user ID." }, { status: 500 });
      }

      // Save post to Database
      const { data: dbPost, error: insertError } = await admin
        .from("posts")
        .insert({
          author_id: botUserId,
          body: postBody.slice(0, 600),
          sentiment: postSentiment,
          cashtags: postCashtags,
        })
        .select(`
          id,
          body,
          sentiment,
          cashtags,
          reply_to,
          created_at,
          author:profiles!posts_author_id_fkey(id, handle, display_name, bio, avatar_url, created_at)
        `)
        .single();

      if (insertError) {
        return NextResponse.json({ error: "Could not save post to database.", details: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, mode: "live", post: dbPost });
    } else {
      // DEMO MODE: Append to in-memory array
      const { DEMO_POSTS } = await import("@/lib/data/demo");
      
      const demoPost: Post = {
        id: `demo-sentinel-${Date.now()}`,
        author: AI_RESEARCH_BOT_PROFILE,
        body: postBody,
        sentiment: postSentiment,
        cashtags: postCashtags,
        reply_to: null,
        like_count: Math.floor(Math.random() * 25) + 10,
        repost_count: Math.floor(Math.random() * 8) + 2,
        reply_count: 0,
        liked_by_me: false,
        reposted_by_me: false,
        created_at: new Date().toISOString(),
      };

      DEMO_POSTS.unshift(demoPost);
      return NextResponse.json({ success: true, mode: "demo", post: demoPost });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Sentinel execution failure.", details: err?.message }, { status: 500 });
  }
}
