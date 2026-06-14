// ─────────────────────────────────────────────────────────────
// The tradable universe used by the mock providers and the UI.
// A curated set of well-known tickers across sectors and regions
// so the product feels alive without any external API.
//
// Mnemo v2 spans the US plus several African markets:
//   WAEMU/BRVM (XOF), ZA/JSE (ZAR), NG/NGX (NGN),
//   EG/EGX (EGP), CEMAC/BVMAC (XAF).
// ─────────────────────────────────────────────────────────────

import type { Currency, Region } from "@/lib/types";

export interface UniverseEntry {
  symbol: string;
  name: string;
  sector: string;
  // A stable seed price used by the deterministic mock market,
  // expressed in the entry's local currency magnitude.
  seed: number;
  region: Region;
  currency: Currency;
}

export const UNIVERSE: UniverseEntry[] = [
  // ── United States (USD) ──────────────────────────────────────
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", seed: 212.4, region: "US", currency: "USD" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", seed: 438.1, region: "US", currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors", seed: 121.7, region: "US", currency: "USD" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", seed: 178.9, region: "US", currency: "USD" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", seed: 201.3, region: "US", currency: "USD" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", seed: 588.2, region: "US", currency: "USD" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", seed: 246.8, region: "US", currency: "USD" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", seed: 142.5, region: "US", currency: "USD" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", seed: 232.1, region: "US", currency: "USD" },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", seed: 312.6, region: "US", currency: "USD" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Media", seed: 712.9, region: "US", currency: "USD" },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Media", seed: 96.4, region: "US", currency: "USD" },
  { symbol: "COIN", name: "Coinbase Global", sector: "Financials", seed: 241.2, region: "US", currency: "USD" },
  { symbol: "PLTR", name: "Palantir Technologies", sector: "Technology", seed: 64.3, region: "US", currency: "USD" },
  { symbol: "UBER", name: "Uber Technologies", sector: "Consumer", seed: 72.1, region: "US", currency: "USD" },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology", seed: 78.5, region: "US", currency: "USD" },
  { symbol: "BA", name: "Boeing Co.", sector: "Industrials", seed: 178.3, region: "US", currency: "USD" },
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", seed: 114.7, region: "US", currency: "USD" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer", seed: 84.2, region: "US", currency: "USD" },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer", seed: 62.8, region: "US", currency: "USD" },

  // ── WAEMU / BRVM (XOF) ───────────────────────────────────────
  { symbol: "SNTS", name: "Sonatel", sector: "Telecom", seed: 18000, region: "WAEMU", currency: "XOF" },
  { symbol: "ETIT", name: "Ecobank Transnational", sector: "Financials", seed: 18, region: "WAEMU", currency: "XOF" },
  { symbol: "SGBC", name: "Societe Generale CI", sector: "Financials", seed: 12000, region: "WAEMU", currency: "XOF" },
  { symbol: "BOAB", name: "Bank of Africa Benin", sector: "Financials", seed: 4500, region: "WAEMU", currency: "XOF" },
  { symbol: "PALC", name: "Palm Cote d'Ivoire", sector: "Consumer", seed: 9000, region: "WAEMU", currency: "XOF" },
  { symbol: "ONTBF", name: "Onatel Burkina", sector: "Telecom", seed: 3200, region: "WAEMU", currency: "XOF" },

  // ── South Africa / JSE (ZAR) ─────────────────────────────────
  { symbol: "NPN", name: "Naspers", sector: "Technology", seed: 3200, region: "ZA", currency: "ZAR" },
  { symbol: "FSR", name: "FirstRand", sector: "Financials", seed: 70, region: "ZA", currency: "ZAR" },
  { symbol: "SOL", name: "Sasol", sector: "Energy", seed: 150, region: "ZA", currency: "ZAR" },
  { symbol: "MTN", name: "MTN Group", sector: "Telecom", seed: 95, region: "ZA", currency: "ZAR" },
  { symbol: "SBK", name: "Standard Bank", sector: "Financials", seed: 210, region: "ZA", currency: "ZAR" },
  { symbol: "AGL", name: "Anglo American", sector: "Materials", seed: 580, region: "ZA", currency: "ZAR" },

  // ── Nigeria / NGX (NGN) ──────────────────────────────────────
  { symbol: "DANGCEM", name: "Dangote Cement", sector: "Materials", seed: 500, region: "NG", currency: "NGN" },
  { symbol: "MTNN", name: "MTN Nigeria", sector: "Telecom", seed: 230, region: "NG", currency: "NGN" },
  { symbol: "GTCO", name: "Guaranty Trust", sector: "Financials", seed: 45, region: "NG", currency: "NGN" },
  { symbol: "ZENITHBANK", name: "Zenith Bank", sector: "Financials", seed: 38, region: "NG", currency: "NGN" },

  // ── Egypt / EGX (EGP) ────────────────────────────────────────
  { symbol: "COMI", name: "Commercial Intl Bank", sector: "Financials", seed: 70, region: "EG", currency: "EGP" },
  { symbol: "SWDY", name: "Elsewedy Electric", sector: "Industrials", seed: 50, region: "EG", currency: "EGP" },
  { symbol: "HRHO", name: "EFG Hermes", sector: "Financials", seed: 20, region: "EG", currency: "EGP" },

  // ── CEMAC / BVMAC (XAF) ──────────────────────────────────────
  { symbol: "SEMC", name: "Ste Eaux Minerales Cameroun", sector: "Consumer", seed: 95000, region: "CEMAC", currency: "XAF" },
  { symbol: "SAFC", name: "Safacam", sector: "Materials", seed: 38000, region: "CEMAC", currency: "XAF" },
];

// ── Market indices ─────────────────────────────────────────────
// INDICES keeps the original 4 US entries (consumed by the
// right-rail and getIndices()); extended with region/currency so
// the shape composes cleanly with ALL_INDICES.
export interface IndexEntry {
  symbol: string;
  name: string;
  seed: number;
  region: Region;
  currency: Currency;
}

export const INDICES: IndexEntry[] = [
  { symbol: "SPX", name: "S&P 500", seed: 5430.2, region: "US", currency: "USD" },
  { symbol: "NDX", name: "Nasdaq 100", seed: 19250.6, region: "US", currency: "USD" },
  { symbol: "DJI", name: "Dow Jones", seed: 41320.9, region: "US", currency: "USD" },
  { symbol: "VIX", name: "Volatility Index", seed: 14.3, region: "US", currency: "USD" },
];

// ALL_INDICES = the 4 US indices PLUS the African market indices.
export const ALL_INDICES: IndexEntry[] = [
  ...INDICES,
  { symbol: "BRVMC", name: "BRVM Composite", seed: 230, region: "WAEMU", currency: "XOF" },
  { symbol: "BRVM30", name: "BRVM 30", seed: 115, region: "WAEMU", currency: "XOF" },
  { symbol: "JALSH", name: "JSE All Share", seed: 78000, region: "ZA", currency: "ZAR" },
  { symbol: "NGXASI", name: "NGX All-Share", seed: 99000, region: "NG", currency: "NGN" },
  { symbol: "EGX30", name: "EGX 30", seed: 28000, region: "EG", currency: "EGP" },
];

// ── Regions metadata for pickers / headers. ────────────────────
// `code` is the short exchange/region tag shown as a restrained mono
// badge in pickers (terminal precision — no emoji flags).
export const REGIONS: { id: Region; label: string; code: string; currency: Currency }[] = [
  { id: "US", label: "United States", code: "US", currency: "USD" },
  { id: "WAEMU", label: "West Africa - BRVM", code: "BRVM", currency: "XOF" },
  { id: "ZA", label: "South Africa - JSE", code: "JSE", currency: "ZAR" },
  { id: "CEMAC", label: "Central Africa - BVMAC", code: "BVMAC", currency: "XAF" },
  { id: "NG", label: "Nigeria - NGX", code: "NGX", currency: "NGN" },
  { id: "EG", label: "Egypt - EGX", code: "EGX", currency: "EGP" },
];

const BY_SYMBOL = new Map(UNIVERSE.map((u) => [u.symbol, u]));
const INDEX_BY_SYMBOL = new Map(ALL_INDICES.map((i) => [i.symbol, i]));

export function lookup(symbol: string): UniverseEntry | undefined {
  return BY_SYMBOL.get(symbol.toUpperCase());
}

export function isKnownSymbol(symbol: string): boolean {
  return BY_SYMBOL.has(symbol.toUpperCase());
}

export const SECTORS = Array.from(new Set(UNIVERSE.map((u) => u.sector))).sort();

// Stocks listed in a given region.
export function byRegion(region: Region): UniverseEntry[] {
  return UNIVERSE.filter((u) => u.region === region);
}

// Indices listed in a given region (drawn from ALL_INDICES).
export function indicesByRegion(region: Region): IndexEntry[] {
  return ALL_INDICES.filter((i) => i.region === region);
}

// Resolve a STOCK or an INDEX in any region to a uniform shape.
// Used by the mock market so any symbol returns a Quote.
export function lookupAny(symbol: string):
  | {
      symbol: string;
      name: string;
      sector: string;
      seed: number;
      region: Region;
      currency: Currency;
      isIndex: boolean;
    }
  | undefined {
  const sym = symbol.toUpperCase();
  const stock = BY_SYMBOL.get(sym);
  if (stock) {
    return {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      seed: stock.seed,
      region: stock.region,
      currency: stock.currency,
      isIndex: false,
    };
  }
  const idx = INDEX_BY_SYMBOL.get(sym);
  if (idx) {
    return {
      symbol: idx.symbol,
      name: idx.name,
      sector: "Index",
      seed: idx.seed,
      region: idx.region,
      currency: idx.currency,
      isIndex: true,
    };
  }
  return undefined;
}
