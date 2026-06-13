import { NextResponse } from "next/server";
import { getAIProvider, type CopilotContext } from "@/lib/ai";
import { getMarketProvider } from "@/lib/market";
import { getServerSupabase } from "@/lib/supabase/server";
import type { ChatMessage, Quote, Region } from "@/lib/types";
import { byRegion, indicesByRegion, lookupAny, REGIONS } from "@/lib/universe";
import { fmtMoney, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// /api/reports — AI-composed markdown research reports.
//
//   POST { kind:"market"|"symbol"|"portfolio", scope? }
//         → { report: { title, body, created_at } }
//   GET   → { reports } (signed-in, live) else { reports: [] }
//
// Build a market context (quotes / candles / insight) then ask the
// AI provider to compose a structured markdown report. On any AI
// failure we fall back to a deterministic templated report so the
// route NEVER 500s. If Supabase + auth are present, best-effort
// persist to the `reports` table.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type ReportKind = "market" | "symbol" | "portfolio";

interface ReportPayload {
  title: string;
  body: string;
  created_at: string;
}

const VALID_REGIONS = new Set<string>(REGIONS.map((r) => r.id));

// A small, representative portfolio used in demo mode so the
// "portfolio" report has something concrete to reason about.
const DEMO_PORTFOLIO = ["AAPL", "NVDA", "JPM", "TSLA", "NPN"];

// ── GET: list the signed-in user's saved reports (live) ─────────
export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ reports: [] });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ reports: [] });

  const { data } = await supabase
    .from("reports")
    .select("id, title, symbol, body, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ reports: data ?? [] });
}

// ── POST: generate a report ─────────────────────────────────────
export async function POST(req: Request) {
  let kind: ReportKind = "market";
  let scope = "";
  try {
    const body = (await req.json()) as { kind?: unknown; scope?: unknown };
    if (body.kind === "symbol" || body.kind === "portfolio" || body.kind === "market") {
      kind = body.kind;
    }
    scope = typeof body.scope === "string" ? body.scope.trim() : "";
  } catch {
    // Empty / invalid body → default to a US market report.
  }

  const report = await buildReport(kind, scope);

  // Best-effort persistence (signed-in only). Never blocks the response.
  try {
    const supabase = await getServerSupabase();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("reports").insert({
          user_id: user.id,
          title: report.title,
          symbol: kind === "symbol" ? scope.toUpperCase() || null : null,
          body: report.body,
        });
      }
    }
  } catch {
    // Persistence is non-critical — swallow and return the report anyway.
  }

  return NextResponse.json({ report });
}

// ─────────────────────────────────────────────────────────────
// Report builders
// ─────────────────────────────────────────────────────────────

async function buildReport(kind: ReportKind, scope: string): Promise<ReportPayload> {
  if (kind === "symbol") return buildSymbolReport(scope);
  if (kind === "portfolio") return buildPortfolioReport();
  return buildMarketReport(scope);
}

// Compact, human-readable context line for a quote.
function quoteLine(q: Quote): string {
  return `${q.symbol} (${q.name}) — ${fmtMoney(q.price, q.currency)} ${fmtPct(q.changePct)}`;
}

// Ask the AI to compose a markdown report from a context blurb. On any
// failure, return the supplied deterministic fallback instead.
async function compose(
  systemNote: string,
  userPrompt: string,
  ctx: CopilotContext,
  fallback: string,
): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are Mnemo's equity research analyst. Write a concise MARKDOWN report. " +
          "Use exactly these second-level headings in order: '## Summary', '## Key levels', " +
          "'## Drivers', '## Risks', '## Outlook'. Use '- ' bullet points under sections where " +
          "useful. Be specific and reference the figures provided. Do not invent precise prices " +
          "you were not given. Keep it under ~350 words. " +
          systemNote,
      },
      { role: "user", content: userPrompt },
    ];
    const body = await getAIProvider().chat(messages, ctx);
    const trimmed = (body ?? "").trim();
    // Guard against an empty/degenerate model reply.
    if (trimmed.length < 40) return fallback;
    return trimmed;
  } catch {
    return fallback;
  }
}

// ── Single-symbol report ────────────────────────────────────────
async function buildSymbolReport(scope: string): Promise<ReportPayload> {
  const symbol = (scope || "AAPL").toUpperCase();
  const market = getMarketProvider();
  const quote = await market.getQuote(symbol);
  const created_at = new Date().toISOString();

  if (!quote) {
    const entry = lookupAny(symbol);
    const name = entry?.name ?? symbol;
    const title = `Research note — ${name} (${symbol})`;
    return {
      title,
      body: templatedSymbolReport(symbol, name, null, []),
      created_at,
    };
  }

  const candles = await market.getCandles(symbol, 60);
  const closes = candles.map((c) => c.close);
  const recent = closes.slice(-30);

  // Best-effort AI flavour text for the Drivers section.
  let insightSummary = "";
  try {
    const insight = await getAIProvider().generateInsight({
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      changePct: quote.changePct,
      sector: quote.sector,
      recentCloses: recent,
    });
    insightSummary = insight.summary;
  } catch {
    insightSummary = "";
  }

  const title = `Research note — ${quote.name} (${quote.symbol})`;
  const ctx: CopilotContext = {
    symbols: [{ symbol: quote.symbol, price: quote.price, changePct: quote.changePct }],
    note: `Single-name research on ${quote.symbol}.`,
  };

  const prompt =
    `Write a research report on ${quote.name} (${quote.symbol}), sector ${quote.sector}.\n` +
    `Latest: price ${fmtMoney(quote.price, quote.currency)}, change ${fmtPct(quote.changePct)} on the day, ` +
    `open ${fmtMoney(quote.open, quote.currency)}, day range ${fmtMoney(quote.low, quote.currency)}–${fmtMoney(
      quote.high,
      quote.currency,
    )}, prev close ${fmtMoney(quote.prevClose, quote.currency)}.\n` +
    (insightSummary ? `Model read: ${insightSummary}\n` : "") +
    `Use the day range and prior close to discuss key levels.`;

  const fallback = templatedSymbolReport(quote.symbol, quote.name, quote, recent);
  const body = await compose(`Report subject: ${quote.symbol}.`, prompt, ctx, fallback);
  return { title, body, created_at };
}

// ── Region / market report ──────────────────────────────────────
async function buildMarketReport(scope: string): Promise<ReportPayload> {
  const region: Region = VALID_REGIONS.has(scope) ? (scope as Region) : "US";
  const meta = REGIONS.find((r) => r.id === region);
  const label = meta?.label ?? "United States";
  const market = getMarketProvider();
  const created_at = new Date().toISOString();

  const stockEntries = byRegion(region).slice(0, 12);
  const indexEntries = indicesByRegion(region);
  const [quotes, indexQuotes] = await Promise.all([
    market.getQuotes(stockEntries.map((s) => s.symbol)),
    market.getQuotes(indexEntries.map((i) => i.symbol)),
  ]);

  const sorted = [...quotes].sort((a, b) => b.changePct - a.changePct);
  const gainers = sorted.slice(0, 3);
  const losers = sorted.slice(-3).reverse();

  const title = `Market report — ${label}`;
  const ctx: CopilotContext = {
    symbols: sorted
      .slice(0, 5)
      .map((q) => ({ symbol: q.symbol, price: q.price, changePct: q.changePct })),
    note: `Daily market wrap for ${label}.`,
  };

  const indexLine = indexQuotes.map((q) => `${q.name}: ${fmtPct(q.changePct)}`).join(", ");
  const prompt =
    `Write a daily market report for ${label}.\n` +
    (indexLine ? `Indices — ${indexLine}.\n` : "") +
    `Top gainers — ${gainers.map(quoteLine).join("; ")}.\n` +
    `Top decliners — ${losers.map(quoteLine).join("; ")}.\n` +
    `Discuss breadth, leadership by sector, and what to watch next.`;

  const fallback = templatedMarketReport(label, indexQuotes, gainers, losers);
  const body = await compose(`Report subject: ${label} market.`, prompt, ctx, fallback);
  return { title, body, created_at };
}

// ── Portfolio report ────────────────────────────────────────────
async function buildPortfolioReport(): Promise<ReportPayload> {
  const market = getMarketProvider();
  const created_at = new Date().toISOString();

  // Attempt to use the signed-in user's watchlist as their holdings;
  // fall back to a demo basket so the report is always meaningful.
  let symbols = DEMO_PORTFOLIO;
  try {
    const supabase = await getServerSupabase();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("watchlist")
          .select("symbol")
          .eq("user_id", user.id)
          .limit(15);
        const saved = (data ?? []).map((r) => r.symbol as string);
        if (saved.length > 0) symbols = saved;
      }
    }
  } catch {
    // Ignore — demo basket is fine.
  }

  const quotes = await market.getQuotes(symbols);
  const sorted = [...quotes].sort((a, b) => b.changePct - a.changePct);
  const avgChange =
    quotes.length > 0 ? quotes.reduce((a, q) => a + q.changePct, 0) / quotes.length : 0;

  const title = "Portfolio review";
  const ctx: CopilotContext = {
    symbols: quotes
      .slice(0, 6)
      .map((q) => ({ symbol: q.symbol, price: q.price, changePct: q.changePct })),
    note: "Portfolio review across the user's tracked holdings.",
  };

  const prompt =
    `Write a portfolio review for a basket of ${quotes.length} names: ${quotes
      .map(quoteLine)
      .join("; ")}.\n` +
    `Average daily move across the basket: ${fmtPct(avgChange)}.\n` +
    `Discuss concentration, sector exposure, the strongest and weakest holdings, and risk posture.`;

  const fallback = templatedPortfolioReport(quotes, avgChange);
  const body = await compose("Report subject: portfolio review.", prompt, ctx, fallback);
  return { title, body, created_at };
}

// ─────────────────────────────────────────────────────────────
// Deterministic fallbacks (used when AI is unavailable / fails)
// ─────────────────────────────────────────────────────────────

const DISCLAIMER =
  "\n\n---\n\n_AI-generated research for informational purposes only. Not financial advice._";

function templatedSymbolReport(
  symbol: string,
  name: string,
  quote: Quote | null,
  recent: number[],
): string {
  const dir = quote ? (quote.changePct >= 0 ? "higher" : "lower") : "flat";
  const trend =
    recent.length >= 2
      ? recent[recent.length - 1] >= recent[0]
        ? "an uptrend"
        : "a downtrend"
      : "a range";
  const priceLine = quote
    ? `${fmtMoney(quote.price, quote.currency)} (${fmtPct(quote.changePct)} on the day)`
    : "unavailable in demo mode";
  const levels = quote
    ? `- Support near the prior close at ${fmtMoney(quote.prevClose, quote.currency)}.\n` +
      `- Intraday range ${fmtMoney(quote.low, quote.currency)}–${fmtMoney(quote.high, quote.currency)}.\n` +
      `- A close above ${fmtMoney(quote.high, quote.currency)} would extend the move.`
    : "- Levels unavailable without a live quote.";

  return (
    `## Summary\n` +
    `${name} (${symbol}) is trading ${priceLine}. The recent tape describes ${trend}, ` +
    `and the name is moving ${dir} versus the prior session.\n\n` +
    `## Key levels\n${levels}\n\n` +
    `## Drivers\n` +
    `- Sector flows ${quote ? `in ${quote.sector}` : ""} and broad-market risk appetite.\n` +
    `- Volume confirmation relative to the recent average.\n` +
    `- Any upcoming catalysts (earnings, guidance, macro prints).\n\n` +
    `## Risks\n` +
    `- A broad risk-off rotation could override the single-name setup.\n` +
    `- Thin liquidity can exaggerate moves around catalysts.\n\n` +
    `## Outlook\n` +
    `Maintain a disciplined, level-based approach: let the price action confirm before adding, ` +
    `and size positions to the volatility of the name.` +
    DISCLAIMER
  );
}

function templatedMarketReport(
  label: string,
  indexQuotes: Quote[],
  gainers: Quote[],
  losers: Quote[],
): string {
  const idx =
    indexQuotes.length > 0
      ? indexQuotes.map((q) => `- ${q.name}: ${fmtPct(q.changePct)}`).join("\n")
      : "- Index data unavailable.";
  const upList = gainers.map((q) => `- ${quoteLine(q)}`).join("\n") || "- None.";
  const downList = losers.map((q) => `- ${quoteLine(q)}`).join("\n") || "- None.";
  const breadth =
    gainers.length > 0 && gainers[0].changePct >= 0
      ? "constructive, with leadership broadening"
      : "defensive, with leadership narrowing";

  return (
    `## Summary\n` +
    `${label} traded in a ${breadth} fashion. Index moves and the day's leaders and laggards ` +
    `frame the session below.\n\n` +
    `## Key levels\n${idx}\n\n` +
    `## Drivers\n**Gainers**\n${upList}\n\n**Decliners**\n${downList}\n\n` +
    `## Risks\n` +
    `- A reversal in the leading names could drag the broader tape.\n` +
    `- Macro catalysts (rates, currency, commodity moves) remain the key swing factor.\n\n` +
    `## Outlook\n` +
    `Watch whether breadth confirms the index move and whether leadership rotates between sectors ` +
    `into the next session.` +
    DISCLAIMER
  );
}

function templatedPortfolioReport(quotes: Quote[], avgChange: number): string {
  const sorted = [...quotes].sort((a, b) => b.changePct - a.changePct);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const sectors = Array.from(new Set(quotes.map((q) => q.sector)));
  const holdings = quotes.map((q) => `- ${quoteLine(q)}`).join("\n") || "- No holdings found.";

  return (
    `## Summary\n` +
    `The basket of ${quotes.length} holdings moved ${fmtPct(avgChange)} on average today across ` +
    `${sectors.length} sector${sectors.length === 1 ? "" : "s"} (${sectors.join(", ")}).\n\n` +
    `## Key levels\n${holdings}\n\n` +
    `## Drivers\n` +
    (best ? `- Strongest: ${quoteLine(best)}.\n` : "") +
    (worst && worst !== best ? `- Weakest: ${quoteLine(worst)}.\n` : "") +
    `- Sector tilt toward ${sectors[0] ?? "—"}.\n\n` +
    `## Risks\n` +
    `- Concentration risk if a single name or sector dominates the book.\n` +
    `- Correlated drawdowns when the broad market sells off.\n\n` +
    `## Outlook\n` +
    `Consider rebalancing toward your target weights, trimming outsized winners, and ensuring ` +
    `sector exposure matches your conviction and risk tolerance.` +
    DISCLAIMER
  );
}
