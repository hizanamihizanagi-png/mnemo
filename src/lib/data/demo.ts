import type { Post, Profile } from "@/lib/types";

// In-memory demo content used when Supabase is NOT configured, so
// the feed, profiles, and leaderboard are populated out of the box.

function profile(
  id: string,
  handle: string,
  name: string,
  bio: string,
): Profile {
  return {
    id,
    handle,
    display_name: name,
    bio,
    avatar_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

export const DEMO_PROFILES: Record<string, Profile> = {
  quantqueen: profile("d1", "quantqueen", "Quant Queen", "Systematic equities. Charts > vibes."),
  macromaverick: profile("d2", "macromaverick", "Macro Maverick", "Rates, FX, and the Fed. Top-down only."),
  chipsandsilicon: profile("d3", "chipsandsilicon", "Chips & Silicon", "Semis analyst. $NVDA $AMD all day."),
  valuevince: profile("d4", "valuevince", "Value Vince", "Margin of safety. Boring compounders."),
};

function mins(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

export const DEMO_POSTS: Post[] = [
  {
    id: "demo-1",
    author: DEMO_PROFILES.chipsandsilicon,
    body: "Data-center demand for $NVDA still looks underappreciated into next print. Watching gross margin guidance closely — anything above 75% and the bull case is intact.",
    sentiment: "bullish",
    cashtags: ["NVDA"],
    reply_to: null,
    like_count: 128,
    repost_count: 34,
    reply_count: 12,
    liked_by_me: false,
    reposted_by_me: false,
    created_at: mins(8),
  },
  {
    id: "demo-2",
    author: DEMO_PROFILES.macromaverick,
    body: "If CPI comes in soft this week, rate-cut odds reprice fast and risk assets catch a bid. $SPX could test new highs. Macro tailwind > stock picking right now.",
    sentiment: "bullish",
    cashtags: ["SPX"],
    reply_to: null,
    like_count: 89,
    repost_count: 21,
    reply_count: 7,
    liked_by_me: false,
    reposted_by_me: false,
    created_at: mins(23),
  },
  {
    id: "demo-3",
    author: DEMO_PROFILES.quantqueen,
    body: "Relative strength on $AAPL fading vs the Nasdaq. Not bearish outright but trimming into resistance around recent highs. Discipline over conviction.",
    sentiment: "neutral",
    cashtags: ["AAPL"],
    reply_to: null,
    like_count: 54,
    repost_count: 9,
    reply_count: 4,
    liked_by_me: false,
    reposted_by_me: false,
    created_at: mins(41),
  },
  {
    id: "demo-4",
    author: DEMO_PROFILES.valuevince,
    body: "Boring is beautiful: $KO yielding nicely, pricing power intact, recession-resistant cash flows. Not exciting, but it compounds while everyone chases AI names.",
    sentiment: "bullish",
    cashtags: ["KO"],
    reply_to: null,
    like_count: 67,
    repost_count: 15,
    reply_count: 9,
    liked_by_me: false,
    reposted_by_me: false,
    created_at: mins(70),
  },
  {
    id: "demo-5",
    author: DEMO_PROFILES.chipsandsilicon,
    body: "Reminder: $AMD is the second derivative of the AI trade. Higher beta, more torque if the cycle keeps running — but cuts both ways on a selloff.",
    sentiment: "neutral",
    cashtags: ["AMD"],
    reply_to: null,
    like_count: 43,
    repost_count: 6,
    reply_count: 3,
    liked_by_me: false,
    reposted_by_me: false,
    created_at: mins(96),
  },
  {
    id: "demo-6",
    author: DEMO_PROFILES.macromaverick,
    body: "Energy as an inflation hedge is back in focus. $XOM screens cheap on free cash flow if oil holds. Watching OPEC headlines for the catalyst.",
    sentiment: "bullish",
    cashtags: ["XOM"],
    reply_to: null,
    like_count: 38,
    repost_count: 5,
    reply_count: 2,
    liked_by_me: false,
    reposted_by_me: false,
    created_at: mins(140),
  },
];
