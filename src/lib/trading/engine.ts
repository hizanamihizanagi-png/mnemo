import type { Portfolio, Position, Quote, Trade } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Paper-trading engine (pure functions).
//
// IMPORTANT: This is SIMULATED investing only. No real money or
// securities change hands. Real-money trading requires a licensed
// broker-dealer plus KYC/AML and regulatory compliance. The
// PaperBroker interface below is the seam where a licensed broker
// integration would later plug in.
// ─────────────────────────────────────────────────────────────

export interface RawPosition {
  symbol: string;
  quantity: number;
  avg_price: number;
}

export interface OrderRequest {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
}

export interface OrderResult {
  ok: boolean;
  error?: string;
  // The mutated cash + positions after a successful fill.
  cash?: number;
  positions?: RawPosition[];
  fillPrice?: number;
}

export const STARTING_CASH = Number(
  process.env.NEXT_PUBLIC_PAPER_STARTING_CASH || 100_000,
);

// Apply a market order at the given fill price. Pure: returns new state.
export function applyOrder(
  cash: number,
  positions: RawPosition[],
  order: OrderRequest,
  fillPrice: number,
): OrderResult {
  const qty = Math.floor(order.quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false, error: "Quantity must be a positive whole number." };
  }
  if (!Number.isFinite(fillPrice) || fillPrice <= 0) {
    return { ok: false, error: "No valid market price available." };
  }

  const next = positions.map((p) => ({ ...p }));
  const existing = next.find((p) => p.symbol === order.symbol);

  if (order.side === "buy") {
    const cost = qty * fillPrice;
    if (cost > cash + 1e-6) {
      return { ok: false, error: "Insufficient buying power." };
    }
    if (existing) {
      const totalQty = existing.quantity + qty;
      existing.avg_price =
        (existing.avg_price * existing.quantity + fillPrice * qty) / totalQty;
      existing.quantity = totalQty;
    } else {
      next.push({ symbol: order.symbol, quantity: qty, avg_price: fillPrice });
    }
    return { ok: true, cash: cash - cost, positions: next, fillPrice };
  }

  // sell
  if (!existing || existing.quantity < qty) {
    return { ok: false, error: "Not enough shares to sell." };
  }
  existing.quantity -= qty;
  const proceeds = qty * fillPrice;
  const remaining = next.filter((p) => p.quantity > 0);
  return { ok: true, cash: cash + proceeds, positions: remaining, fillPrice };
}

// Build a rich Portfolio view by marking positions to market.
export function buildPortfolio(
  cash: number,
  raw: RawPosition[],
  quotes: Map<string, Quote>,
): Portfolio {
  const positions: Position[] = raw.map((p) => {
    const q = quotes.get(p.symbol);
    const lastPrice = q?.price ?? p.avg_price;
    const marketValue = lastPrice * p.quantity;
    const costBasis = p.avg_price * p.quantity;
    const unrealizedPnl = marketValue - costBasis;
    return {
      symbol: p.symbol,
      name: q?.name ?? p.symbol,
      quantity: p.quantity,
      avgPrice: p.avg_price,
      lastPrice,
      marketValue,
      costBasis,
      unrealizedPnl,
      unrealizedPnlPct: costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0,
    };
  });

  const positionsValue = positions.reduce((a, p) => a + p.marketValue, 0);
  const equity = cash + positionsValue;
  const totalReturn = equity - STARTING_CASH;

  return {
    cash,
    equity,
    positions: positions.sort((a, b) => b.marketValue - a.marketValue),
    startingCash: STARTING_CASH,
    totalReturn,
    totalReturnPct: (totalReturn / STARTING_CASH) * 100,
  };
}

export function makeTrade(order: OrderRequest, fillPrice: number): Omit<Trade, "id" | "created_at"> {
  return {
    symbol: order.symbol,
    side: order.side,
    quantity: Math.floor(order.quantity),
    price: fillPrice,
  };
}
