// ─────────────────────────────────────────────────────────────
// Mnemo Terminal — command engine.
//
// A tiny Bloomberg-style command parser. Each command resolves to
// an array of TerminalBlocks (a tagged union) that the Terminal UI
// knows how to render. Everything goes through the existing public
// API routes so it works in demo mode (no keys, no 500s): unknown
// or failed lookups degrade to friendly text/error blocks.
// ─────────────────────────────────────────────────────────────

import type { Quote } from "@/lib/types";

// ── Output block types ─────────────────────────────────────────
export type TerminalBlock =
  | { type: "text"; text: string }
  | { type: "quote"; quote: Quote }
  | { type: "chart"; symbol: string; closes: number[]; up: boolean }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "ai"; text: string }
  | { type: "error"; text: string };

// ── Help text ──────────────────────────────────────────────────
const HELP_ROWS: [string, string][] = [
  ["help", "show this command list"],
  ["quote SYM", "latest quote for a symbol (e.g. quote AAPL)"],
  ["chart SYM [days]", "price chart, default 90 days"],
  ["compare A B", "side-by-side comparison of two symbols"],
  ["watch", "your saved watchlist quotes"],
  ["news [REGION]", "latest headlines (US, WAEMU, ZA, CEMAC, NG, EG)"],
  ["ask <question>", "ask the Mnemo AI copilot anything"],
];

// ── Fetch helpers ──────────────────────────────────────────────
// Build absolute-or-relative URLs that work both in the browser
// (relative is fine) and avoid throwing on network hiccups.
async function getJSON<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchQuote(symbol: string): Promise<Quote | null> {
  const data = await getJSON<{ quote: Quote | null }>(
    `/api/market/quote?symbol=${encodeURIComponent(symbol)}`,
  );
  return data?.quote ?? null;
}

async function fetchCloses(symbol: string, days: number): Promise<number[]> {
  const data = await getJSON<{ candles: { close: number }[] }>(
    `/api/market/candles?symbol=${encodeURIComponent(symbol)}&days=${days}`,
  );
  return (data?.candles ?? []).map((c) => c.close);
}

// ── Per-command handlers ───────────────────────────────────────
function helpBlocks(): TerminalBlock[] {
  return [
    {
      type: "table",
      headers: ["Command", "Description"],
      rows: HELP_ROWS.map(([c, d]) => [c, d]),
    },
  ];
}

async function quoteBlocks(args: string[]): Promise<TerminalBlock[]> {
  const symbol = (args[0] ?? "").toUpperCase();
  if (!symbol) return [{ type: "error", text: "Usage: quote SYM" }];
  const quote = await fetchQuote(symbol);
  if (!quote) return [{ type: "error", text: `No quote for "${symbol}".` }];
  return [{ type: "quote", quote }];
}

async function chartBlocks(args: string[]): Promise<TerminalBlock[]> {
  const symbol = (args[0] ?? "").toUpperCase();
  if (!symbol) return [{ type: "error", text: "Usage: chart SYM [days]" }];
  const rawDays = Number(args[1]);
  const days = Number.isFinite(rawDays) && rawDays > 0 ? Math.min(Math.floor(rawDays), 365) : 90;
  const closes = await fetchCloses(symbol, days);
  if (closes.length < 2) {
    return [{ type: "error", text: `No chart data for "${symbol}".` }];
  }
  const up = closes[closes.length - 1] >= closes[0];
  return [
    { type: "text", text: `${symbol} — last ${closes.length} sessions` },
    { type: "chart", symbol, closes, up },
  ];
}

async function compareBlocks(args: string[]): Promise<TerminalBlock[]> {
  const a = (args[0] ?? "").toUpperCase();
  const b = (args[1] ?? "").toUpperCase();
  if (!a || !b) return [{ type: "error", text: "Usage: compare A B" }];
  const [qa, qb] = await Promise.all([fetchQuote(a), fetchQuote(b)]);
  if (!qa && !qb) {
    return [{ type: "error", text: `No quotes for "${a}" or "${b}".` }];
  }
  const fields: [string, (q: Quote) => string][] = [
    ["Name", (q) => q.name],
    ["Price", (q) => q.price.toFixed(2)],
    ["Change", (q) => q.change.toFixed(2)],
    ["Change %", (q) => `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`],
    ["Open", (q) => q.open.toFixed(2)],
    ["High", (q) => q.high.toFixed(2)],
    ["Low", (q) => q.low.toFixed(2)],
    ["Prev close", (q) => q.prevClose.toFixed(2)],
    ["Sector", (q) => q.sector],
    ["Currency", (q) => q.currency],
  ];
  const cell = (q: Quote | null, fn: (q: Quote) => string) => (q ? fn(q) : "—");
  const rows = fields.map(([label, fn]) => [label, cell(qa, fn), cell(qb, fn)]);
  return [
    {
      type: "table",
      headers: ["", a, b],
      rows,
    },
  ];
}

async function watchBlocks(): Promise<TerminalBlock[]> {
  const data = await getJSON<{ symbols: string[] }>(`/api/watchlist`);
  const symbols = data?.symbols ?? [];
  if (symbols.length === 0) {
    return [
      {
        type: "text",
        text: "Your watchlist is empty. Sign in and add symbols from Markets.",
      },
    ];
  }
  const quotes = await Promise.all(symbols.map((s) => fetchQuote(s)));
  const rows = quotes
    .map((q, i) =>
      q
        ? [q.symbol, q.name, q.price.toFixed(2), `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`]
        : [symbols[i], "—", "—", "—"],
    )
    .filter(Boolean) as string[][];
  return [
    {
      type: "table",
      headers: ["Symbol", "Name", "Price", "Chg%"],
      rows,
    },
  ];
}

async function newsBlocks(args: string[]): Promise<TerminalBlock[]> {
  const region = (args[0] ?? "").toUpperCase();
  const qs = region ? `?region=${encodeURIComponent(region)}` : "";
  // The news API is owned by another slice and may not be live yet;
  // any non-ok response degrades to a friendly text block.
  const data = await getJSON<{ items?: { title: string; source?: string }[] }>(
    `/api/news${qs}`,
  );
  if (!data || !Array.isArray(data.items)) {
    return [{ type: "text", text: "news unavailable" }];
  }
  if (data.items.length === 0) {
    return [{ type: "text", text: "No headlines right now." }];
  }
  return [
    {
      type: "table",
      headers: ["Headline", "Source"],
      rows: data.items.slice(0, 12).map((n) => [n.title, n.source ?? "—"]),
    },
  ];
}

async function askBlocks(question: string): Promise<TerminalBlock[]> {
  const q = question.trim();
  if (!q) return [{ type: "error", text: "Usage: ask <question>" }];
  const data = await getJSON<{ reply?: string; message?: string; content?: string }>(
    `/api/copilot`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: q }] }),
    },
  );
  // Accept a few plausible response shapes from the copilot route.
  const reply = data?.reply ?? data?.message ?? data?.content;
  if (!reply) {
    return [{ type: "text", text: "The copilot is unavailable right now." }];
  }
  return [{ type: "ai", text: reply }];
}

// ── Dispatcher ─────────────────────────────────────────────────
export async function runCommand(line: string): Promise<TerminalBlock[]> {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+/);
  const cmd = (parts[0] ?? "").toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "help":
      return helpBlocks();
    case "quote":
      return quoteBlocks(args);
    case "chart":
      return chartBlocks(args);
    case "compare":
      return compareBlocks(args);
    case "watch":
      return watchBlocks();
    case "news":
      return newsBlocks(args);
    case "ask":
      // Preserve the original spacing of the question.
      return askBlocks(trimmed.slice(cmd.length).trim());
    default:
      return [{ type: "error", text: "Unknown command. Type 'help'." }];
  }
}
