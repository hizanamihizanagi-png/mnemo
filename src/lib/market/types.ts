import type { Candle, MarketIndex, Quote } from "@/lib/types";

export interface MarketProvider {
  name: string;
  getQuote(symbol: string): Promise<Quote | null>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getCandles(symbol: string, days: number): Promise<Candle[]>;
  getIndices(): Promise<MarketIndex[]>;
  search(query: string): Promise<Quote[]>;
}
