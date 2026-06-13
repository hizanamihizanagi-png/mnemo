import { finnhubMarket } from "./finnhub";
import { mockMarket } from "./mock";
import type { MarketProvider } from "./types";

let cached: MarketProvider | null = null;

export function getMarketProvider(): MarketProvider {
  if (cached) return cached;
  const choice = (process.env.MARKET_PROVIDER ?? "mock").toLowerCase();
  if (choice === "finnhub" && process.env.FINNHUB_API_KEY) {
    cached = finnhubMarket;
  } else {
    cached = mockMarket;
  }
  return cached;
}

export type { MarketProvider } from "./types";
