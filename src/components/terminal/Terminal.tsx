"use client";

import { useEffect, useRef, useState } from "react";
import MiniChart from "@/components/ui/MiniChart";
import { runCommand, type TerminalBlock } from "@/lib/terminal/commands";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Mnemo Terminal — the interactive shell.
//
// A dark, monospaced command surface: a scrolling output log of
// TerminalBlocks plus a "›" prompt row. Command history is recalled
// with ↑/↓ and persisted to localStorage. Everything runs against
// the public API routes, so it works in demo mode out of the box.
// ─────────────────────────────────────────────────────────────

const HIST_KEY = "mnemo-terminal-hist";
const HIST_MAX = 100;

// A rendered entry pairs the echoed command with its result blocks.
interface LogEntry {
  id: number;
  command: string | null; // null for the seeded welcome entry
  blocks: TerminalBlock[];
  pending?: boolean;
}

const WELCOME: TerminalBlock[] = [
  {
    type: "text",
    text: "Mnemo Terminal — interconnected, AI-native market intelligence.",
  },
  { type: "text", text: "Type 'help' to see the available commands." },
];

export default function Terminal() {
  const [log, setLog] = useState<LogEntry[]>([
    { id: 0, command: null, blocks: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  // Command history (most-recent last). `histIdx` is the recall cursor;
  // null means "at the live input" (not browsing history).
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);

  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load persisted history once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.filter((x): x is string => typeof x === "string"));
        }
      }
    } catch {
      // Corrupt/blocked storage — ignore and start fresh.
    }
  }, []);

  // Auto-scroll to the newest block whenever the log grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  function persistHistory(next: string[]) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HIST_KEY, JSON.stringify(next.slice(-HIST_MAX)));
    } catch {
      // Storage unavailable — keep history in memory only.
    }
  }

  async function submit(raw: string) {
    const command = raw.trim();
    if (!command || busy) return;

    // Push to history (de-dupe consecutive repeats) and persist.
    setHistory((prev) => {
      const next = prev[prev.length - 1] === command ? prev : [...prev, command];
      persistHistory(next);
      return next.slice(-HIST_MAX);
    });
    setHistIdx(null);
    setInput("");

    const entryId = nextId.current++;
    setLog((prev) => [...prev, { id: entryId, command, blocks: [], pending: true }]);
    setBusy(true);

    let blocks: TerminalBlock[];
    try {
      blocks = await runCommand(command);
    } catch {
      blocks = [{ type: "error", text: "Command failed. Try again." }];
    }

    setLog((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, blocks, pending: false } : e)),
    );
    setBusy(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void submit(input);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === null) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(null);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx] ?? "");
      }
    }
  }

  return (
    <div
      className="flex min-h-[60vh] flex-col overflow-hidden rounded-lg border border-line bg-bg font-mono text-sm text-slate-200"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output log */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {log.map((entry) => (
          <div key={entry.id} className="space-y-1.5">
            {entry.command !== null && (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-brand">›</span>
                <span className="text-slate-200">{entry.command}</span>
              </div>
            )}
            {entry.pending ? (
              <div className="pl-4 text-muted">…</div>
            ) : (
              entry.blocks.map((block, i) => (
                <BlockView key={i} block={block} />
              ))
            )}
          </div>
        ))}
      </div>

      {/* Prompt row */}
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <span className="text-brand">›</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHistIdx(null);
          }}
          onKeyDown={onKeyDown}
          disabled={busy}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="Type a command — try 'help', 'quote AAPL', or 'ask why is the market up?'"
          className="flex-1 bg-transparent text-slate-100 placeholder:text-muted focus:outline-none disabled:opacity-50"
          aria-label="Terminal command input"
        />
      </div>

      {/* Help footer */}
      <div className="border-t border-line px-4 py-2 text-xs text-muted">
        Commands: help · quote · chart · compare · watch · news · ask &nbsp;|&nbsp; ↑/↓ for history
      </div>
    </div>
  );
}

// ── Block renderers ────────────────────────────────────────────
function BlockView({ block }: { block: TerminalBlock }) {
  switch (block.type) {
    case "text":
      return <div className="whitespace-pre-wrap pl-4 text-slate-300">{block.text}</div>;

    case "error":
      return <div className="whitespace-pre-wrap pl-4 text-bear">{block.text}</div>;

    case "ai":
      return (
        <div className="ml-4 rounded-md border border-line bg-bg-card p-3">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-brand">Mnemo AI</div>
          <div className="whitespace-pre-wrap text-slate-200">{block.text}</div>
        </div>
      );

    case "quote":
      return <QuoteCard block={block} />;

    case "chart":
      return (
        <div className="ml-4 max-w-md rounded-md border border-line bg-bg-card p-3">
          <MiniChart data={block.closes} up={block.up} height={64} />
        </div>
      );

    case "table":
      return <TableView headers={block.headers} rows={block.rows} />;

    default:
      return null;
  }
}

function QuoteCard({ block }: { block: Extract<TerminalBlock, { type: "quote" }> }) {
  const q = block.quote;
  const up = q.changePct >= 0;
  const rows: [string, string][] = [
    ["Price", `${q.price.toFixed(2)} ${q.currency}`],
    ["Change", `${q.change >= 0 ? "+" : ""}${q.change.toFixed(2)} (${up ? "+" : ""}${q.changePct.toFixed(2)}%)`],
    ["Open", q.open.toFixed(2)],
    ["High", q.high.toFixed(2)],
    ["Low", q.low.toFixed(2)],
    ["Prev close", q.prevClose.toFixed(2)],
    ["Sector", q.sector],
  ];
  return (
    <div className="ml-4 max-w-sm rounded-md border border-line bg-bg-card p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-semibold text-slate-100">{q.symbol}</span>
        <span className="truncate text-xs text-muted">{q.name}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd
              className={cn(
                "text-right text-slate-200",
                k === "Change" && (up ? "text-bull" : "text-bear"),
              )}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TableView({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="ml-4 overflow-x-auto">
      <table className="border-collapse text-left text-xs">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="border border-line px-2 py-1 font-semibold text-slate-300"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-line px-2 py-1 text-slate-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
