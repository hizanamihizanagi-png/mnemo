// ─────────────────────────────────────────────────────────────
// Heuristic finance topic detection.
//
// Mnemo is finance-only. This lexicon powers a fast, key-free
// pre-filter that scores how market-related a piece of text is.
// The AI classifier (when configured) refines borderline cases.
// ─────────────────────────────────────────────────────────────

export const FINANCE_TERMS: string[] = [
  // instruments & assets
  "stock", "stocks", "share", "shares", "equity", "equities", "bond", "bonds",
  "etf", "option", "options", "call", "puts", "put", "future", "futures",
  "crypto", "bitcoin", "ethereum", "token", "commodity", "commodities", "gold",
  "oil", "forex", "currency", "dividend", "dividends", "yield",
  // markets & action
  "market", "markets", "nasdaq", "nyse", "sp500", "s&p", "dow", "index",
  "indices", "rally", "selloff", "sell-off", "correction", "crash", "bubble",
  "volatility", "vix", "liquidity", "volume", "breakout", "support",
  "resistance", "trend", "momentum",
  // sentiment & positions
  "bull", "bullish", "bear", "bearish", "long", "short", "buy", "sell", "hold",
  "position", "portfolio", "trade", "trader", "trading", "invest", "investor",
  "investing", "investment", "hedge", "leverage", "margin",
  // fundamentals & corporate
  "earnings", "revenue", "profit", "guidance", "valuation", "pe", "p/e",
  "eps", "ipo", "merger", "acquisition", "buyback", "ticker", "shareholder",
  "balance sheet", "cash flow", "forecast", "estimate", "downgrade", "upgrade",
  "price target", "analyst", "rating",
  // macro
  "fed", "fomc", "interest rate", "rates", "inflation", "cpi", "ppi", "gdp",
  "recession", "stimulus", "tariff", "treasury", "bond yield", "jobs report",
  "unemployment", "central bank", "ecb", "rate cut", "rate hike",
  // prediction framing
  "prediction", "predict", "forecast", "outlook", "target", "upside",
  "downside", "catalyst", "thesis", "due diligence", "dd",
];

const TERM_SET = new Set(FINANCE_TERMS);

// Returns 0..1 — fraction of signal that content is finance-related.
export function financeScore(text: string): number {
  const lower = text.toLowerCase();

  // Cashtags are a very strong finance signal.
  const cashtags = (lower.match(/\$[a-z]{1,6}\b/g) ?? []).length;

  // Tokenize on non-word boundaries.
  const words = lower.split(/[^a-z&/]+/).filter(Boolean);
  if (words.length === 0 && cashtags === 0) return 0;

  let hits = 0;
  for (const w of words) {
    if (TERM_SET.has(w)) hits++;
  }
  // Multi-word phrases.
  for (const phrase of ["interest rate", "balance sheet", "cash flow", "price target", "bond yield", "jobs report", "central bank", "rate cut", "rate hike", "due diligence"]) {
    if (lower.includes(phrase)) hits++;
  }

  const cashtagBoost = Math.min(cashtags, 3) * 0.25;
  const density = hits / Math.sqrt(words.length || 1);
  const score = Math.min(1, density * 0.9 + cashtagBoost);
  return score;
}
