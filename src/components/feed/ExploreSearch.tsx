"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ExploreSearch — a client-side filter over the ticker universe.
//
// The universe is passed in from the server (no client dependency on
// other slices' data). Matches symbol or company name; each result
// links to the market page for that symbol.
// ─────────────────────────────────────────────────────────────

export interface SearchEntry {
  symbol: string;
  name: string;
  sector: string;
}

export default function ExploreSearch({ universe }: { universe: SearchEntry[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return universe
      .filter(
        (u) =>
          u.symbol.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, universe]);

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickers and companies…"
          className="input pl-9"
          aria-label="Search the ticker universe"
        />
      </div>

      {results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-line bg-bg-card">
          {results.map((u) => (
            <li key={u.symbol}>
              <Link
                href={`/markets/${u.symbol}`}
                className="flex items-center justify-between px-3 py-2.5 transition hover:bg-bg-soft"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-brand">${u.symbol}</span>
                  <span className="truncate text-sm text-slate-200">{u.name}</span>
                </div>
                <span className="chip border-line text-muted">{u.sector}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && results.length === 0 && (
        <p className="mt-2 px-1 text-sm text-muted">No matching tickers.</p>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
