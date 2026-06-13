// ─────────────────────────────────────────────────────────────
// The tradable universe used by the mock providers and the UI.
// A curated set of well-known tickers across sectors so the
// product feels alive without any external API.
// ─────────────────────────────────────────────────────────────

export interface UniverseEntry {
  symbol: string;
  name: string;
  sector: string;
  // A stable seed price used by the deterministic mock market.
  seed: number;
}

export const UNIVERSE: UniverseEntry[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", seed: 212.4 },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", seed: 438.1 },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors", seed: 121.7 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", seed: 178.9 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", seed: 201.3 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", seed: 588.2 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", seed: 246.8 },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", seed: 142.5 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", seed: 232.1 },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", seed: 312.6 },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Media", seed: 712.9 },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Media", seed: 96.4 },
  { symbol: "COIN", name: "Coinbase Global", sector: "Financials", seed: 241.2 },
  { symbol: "PLTR", name: "Palantir Technologies", sector: "Technology", seed: 64.3 },
  { symbol: "UBER", name: "Uber Technologies", sector: "Consumer", seed: 72.1 },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology", seed: 78.5 },
  { symbol: "BA", name: "Boeing Co.", sector: "Industrials", seed: 178.3 },
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", seed: 114.7 },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer", seed: 84.2 },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer", seed: 62.8 },
];

export const INDICES = [
  { symbol: "SPX", name: "S&P 500", seed: 5430.2 },
  { symbol: "NDX", name: "Nasdaq 100", seed: 19250.6 },
  { symbol: "DJI", name: "Dow Jones", seed: 41320.9 },
  { symbol: "VIX", name: "Volatility Index", seed: 14.3 },
];

const BY_SYMBOL = new Map(UNIVERSE.map((u) => [u.symbol, u]));

export function lookup(symbol: string): UniverseEntry | undefined {
  return BY_SYMBOL.get(symbol.toUpperCase());
}

export function isKnownSymbol(symbol: string): boolean {
  return BY_SYMBOL.has(symbol.toUpperCase());
}

export const SECTORS = Array.from(new Set(UNIVERSE.map((u) => u.sector))).sort();
