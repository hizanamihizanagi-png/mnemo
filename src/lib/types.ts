// ─────────────────────────────────────────────────────────────
// Shared domain types for Mnemo.
// ─────────────────────────────────────────────────────────────

export type Sentiment = "bullish" | "bearish" | "neutral";

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  marketCap?: number;
  currency: string;
  sector: string;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePct: number;
}

export interface Post {
  id: string;
  author: Profile;
  body: string;
  sentiment: Sentiment;
  cashtags: string[];
  reply_to: string | null;
  like_count: number;
  repost_count: number;
  reply_count: number;
  liked_by_me: boolean;
  reposted_by_me: boolean;
  created_at: string;
}

export interface Prediction {
  id: string;
  symbol: string;
  direction: "up" | "down";
  // Forecasted percentage move over the horizon.
  targetPct: number;
  confidence: number; // 0..1
  horizon: "1d" | "1w" | "1m" | "3m";
  rationale: string;
  drivers: string[];
  risk: string;
  model: string;
  created_at: string;
}

export interface Insight {
  symbol: string;
  summary: string;
  sentiment: Sentiment;
  bullets: string[];
  prediction: Prediction;
  disclaimer: string;
}

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

export interface Portfolio {
  cash: number;
  equity: number; // cash + positions market value
  positions: Position[];
  startingCash: number;
  totalReturn: number;
  totalReturnPct: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  created_at: string;
}

export interface LeaderboardEntry {
  handle: string;
  display_name: string;
  avatar_url: string | null;
  returnPct: number;
  equity: number;
}

export interface ModerationResult {
  allowed: boolean;
  reason: string;
  topicScore: number; // 0..1 confidence that content is finance-related
}

// ─────────────────────────────────────────────────────────────
// Regions & currencies (Mnemo v2 — US + African markets).
// ─────────────────────────────────────────────────────────────
export type Region = "US" | "WAEMU" | "ZA" | "CEMAC" | "NG" | "EG";
export type Currency = "USD" | "XOF" | "ZAR" | "XAF" | "NGN" | "EGP";

// ── Social: follow relationship state for a profile. ───────────
export interface FollowState {
  following: boolean;
  followers: number;
  following_count: number;
}

// ─────────────────────────────────────────────────────────────
// Reputation / track record.
// ─────────────────────────────────────────────────────────────
export type ReputationTier = "Rookie" | "Bronze" | "Silver" | "Gold" | "Top 1%";

export interface TrackRecord {
  accuracy: number; // 0..1 hit rate of resolved predictions
  alpha: number; // excess return vs. baseline, in percentage points
  nPredictions: number;
  nResolved: number;
  tier: ReputationTier;
}

// ─────────────────────────────────────────────────────────────
// Prediction ledger — a logged "call" with an entry, a target, a
// timeline and a resolution. This is what makes a track record
// *verifiable* rather than self-reported.
// ─────────────────────────────────────────────────────────────
export type PredictionStatus = "open" | "hit" | "missed";

export interface PredictionRecord {
  id: string;
  symbol: string;
  direction: "up" | "down";
  targetPct: number; // forecast move, signed by direction
  horizon: "1d" | "1w" | "1m" | "3m";
  entryPrice: number;
  createdAt: string; // ISO
  resolvesAt: string; // ISO — createdAt + horizon
  status: PredictionStatus;
  resolvedPrice?: number;
  realizedPct?: number; // actual % move at resolution, signed
}

// ─────────────────────────────────────────────────────────────
// AI copilot chat.
// ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export interface ChatModel {
  id: string;
  label: string;
  provider: "gemini" | "openai" | "mock";
  available: boolean;
}
