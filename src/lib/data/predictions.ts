import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMarketProvider } from "@/lib/market";
import { demoTrackRecord, trackRecordFromPredictions } from "@/lib/reputation";
import { UNIVERSE } from "@/lib/universe";
import type { PredictionRecord, TrackRecord } from "@/lib/types";
import { hashString, mulberry32 } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// The prediction ledger — the heart of the "Proof" pillar.
//
// A ledger entry is a logged call (symbol, direction, entry price,
// target %, horizon) that *resolves* into hit / missed once its
// horizon passes. Reputation is then computed from real outcomes,
// not from volume.
//
// Demo mode (no Supabase) synthesizes a deterministic ledger whose
// hit-rate matches demoTrackRecord(handle), so every surface agrees.
// Live mode reads the predictions table and resolves due calls
// against current prices in-memory. Nothing here ever throws.
// ─────────────────────────────────────────────────────────────

const HORIZON_DAYS: Record<PredictionRecord["horizon"], number> = {
  "1d": 1,
  "1w": 7,
  "1m": 30,
  "3m": 90,
};
const HORIZONS: PredictionRecord["horizon"][] = ["1d", "1w", "1m", "3m"];
const DAY = 86_400_000;

// Liquid US symbols that always have a valid /markets/[symbol] page.
function usSymbols(): string[] {
  const us = UNIVERSE.filter((u) => u.region === "US").map((u) => u.symbol);
  return us.length > 0 ? us : ["AAPL", "MSFT", "NVDA", "AMZN", "TSLA"];
}

export interface Ledger {
  records: PredictionRecord[];
  trackRecord: TrackRecord;
}

// ── Demo ledger ────────────────────────────────────────────────
// Deterministic per handle; statuses distributed to match the
// canonical demo track record (counts + accuracy).
function genDemoLedger(handle: string): PredictionRecord[] {
  const h = handle.toLowerCase();
  const tr = demoTrackRecord(h);
  const rng = mulberry32(hashString("ledger:" + h));
  const syms = usSymbols();

  const total = Math.min(tr.nPredictions, 18); // display cap
  const resolvedRatio = tr.nResolved / Math.max(1, tr.nPredictions);
  const resolvedCount = Math.round(total * resolvedRatio);
  const hits = Math.round(resolvedCount * tr.accuracy);
  const now = Date.now();

  const recs: PredictionRecord[] = [];
  for (let i = 0; i < total; i++) {
    const symbol = syms[Math.floor(rng() * syms.length)] ?? "AAPL";
    const horizon = HORIZONS[Math.floor(rng() * HORIZONS.length)];
    const direction: "up" | "down" = rng() > 0.45 ? "up" : "down";
    const mag = Number((1 + rng() * 9).toFixed(1));
    const targetPct = direction === "up" ? mag : -mag;
    const entryPrice = Number((20 + rng() * 480).toFixed(2));
    const ageDays = 1 + Math.floor(rng() * 120);
    const createdAt = new Date(now - ageDays * DAY).toISOString();
    const resolvesAt = new Date(
      now - ageDays * DAY + HORIZON_DAYS[horizon] * DAY,
    ).toISOString();
    recs.push({
      id: `demo-${h}-${i}`,
      symbol,
      direction,
      targetPct,
      horizon,
      entryPrice,
      createdAt,
      resolvesAt,
      status: "open",
    });
  }

  // Resolve oldest-first so settled calls read as the older ones.
  const byOldest = [...recs].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  );
  for (let i = 0; i < byOldest.length && i < resolvedCount; i++) {
    const r = byOldest[i];
    const isHit = i < hits;
    const correctSign = r.direction === "up" ? 1 : -1;
    const sign = isHit ? correctSign : -correctSign;
    const mag = Math.abs(r.targetPct) * (0.5 + rng() * 0.9);
    const realized = Number((sign * mag).toFixed(2));
    r.status = isHit ? "hit" : "missed";
    r.realizedPct = realized;
    r.resolvedPrice = Number((r.entryPrice * (1 + realized / 100)).toFixed(2));
  }

  // Newest first for display.
  return recs.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

// ── Live resolution ────────────────────────────────────────────
// Map DB rows to records, resolving any past-due unresolved call
// against the current price (in-memory — we don't write back here).
function resolveRow(
  row: Record<string, unknown>,
  priceNow: number | undefined,
): PredictionRecord {
  const direction = (row.direction as "up" | "down") ?? "up";
  const horizon = (row.horizon as PredictionRecord["horizon"]) ?? "1m";
  const createdAt = (row.created_at as string) ?? new Date().toISOString();
  const entryPrice = Number(row.entry_price ?? 0);
  const resolvesAt = new Date(
    +new Date(createdAt) + HORIZON_DAYS[horizon] * DAY,
  ).toISOString();

  const base: PredictionRecord = {
    id: String(row.id ?? createdAt),
    symbol: String(row.symbol ?? "").toUpperCase(),
    direction,
    targetPct: Number(row.target_pct ?? 0),
    horizon,
    entryPrice,
    createdAt,
    resolvesAt,
    status: "open",
  };

  // Already resolved in the DB → trust the stored outcome.
  if (row.resolved === true) {
    const resolvedPrice = row.resolved_price != null ? Number(row.resolved_price) : undefined;
    const realizedPct =
      resolvedPrice != null && entryPrice > 0
        ? Number(((resolvedPrice / entryPrice - 1) * 100).toFixed(2))
        : undefined;
    return { ...base, status: row.outcome ? "hit" : "missed", resolvedPrice, realizedPct };
  }

  // Due and resolvable against a live price.
  const due = Date.now() >= +new Date(resolvesAt);
  if (due && entryPrice > 0 && priceNow != null) {
    const realizedPct = Number(((priceNow / entryPrice - 1) * 100).toFixed(2));
    const correct = direction === "up" ? realizedPct >= 0 : realizedPct <= 0;
    return {
      ...base,
      status: correct ? "hit" : "missed",
      resolvedPrice: priceNow,
      realizedPct,
    };
  }

  return base; // still open
}

function trackRecordFromRecords(records: PredictionRecord[]): TrackRecord {
  return trackRecordFromPredictions(
    records.map((r) => ({
      resolved: r.status !== "open",
      correct: r.status === "hit",
    })),
  );
}

// ── Public read ────────────────────────────────────────────────
export async function getUserPredictionLedger(handle: string): Promise<Ledger> {
  const h = handle.toLowerCase();
  const supabase = await getServerSupabase();

  if (!supabase) {
    const records = genDemoLedger(h);
    return { records, trackRecord: demoTrackRecord(h) };
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", h)
    .maybeSingle();
  if (!prof?.id) {
    const records = genDemoLedger(h);
    return { records, trackRecord: demoTrackRecord(h) };
  }

  const { data: rows } = await supabase
    .from("predictions")
    .select(
      "id, symbol, direction, target_pct, horizon, created_at, entry_price, resolved, outcome, resolved_price",
    )
    .eq("user_id", prof.id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (!rows || rows.length === 0) {
    // No real calls yet — fall back to the demo ledger so the profile
    // isn't empty, but the headline reputation stays the demo record.
    const records = genDemoLedger(h);
    return { records, trackRecord: demoTrackRecord(h) };
  }

  // Batch one quote lookup per unique symbol for in-memory resolution.
  const market = getMarketProvider();
  const symbols = Array.from(new Set(rows.map((r) => String(r.symbol).toUpperCase())));
  const quotes = await market.getQuotes(symbols).catch(() => []);
  const priceBySymbol = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q.price]));

  const records = rows.map((r) =>
    resolveRow(r as Record<string, unknown>, priceBySymbol.get(String(r.symbol).toUpperCase())),
  );
  return { records, trackRecord: trackRecordFromRecords(records) };
}
