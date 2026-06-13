"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/types";
import { cn, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// MarketSearch — debounced symbol/name search with a dropdown.
//
// Client component. Typing (debounced ~200ms) hits /api/market/search;
// results link to /markets/SYMBOL. Pressing Enter navigates to the
// first result (or the typed symbol if it looks like a ticker). The
// dropdown closes on outside click / Escape. Keyboard: ↑/↓ to move.
// ─────────────────────────────────────────────────────────────

export default function MarketSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Quote[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Debounced fetch.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { results: Quote[] };
        setResults(data.results);
        setActive(0);
      } catch {
        // Aborted or network error — ignore.
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(symbol: string) {
    setOpen(false);
    setQuery("");
    router.push(`/markets/${symbol.toUpperCase()}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const chosen = results[active];
      if (chosen) {
        go(chosen.symbol);
      } else if (/^[A-Za-z]{1,6}$/.test(query.trim())) {
        go(query.trim());
      }
    }
  }

  const showDropdown = open && query.trim().length > 0 && results.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a symbol or company…"
          className="input pl-9 font-mono"
          aria-label="Search markets"
          autoComplete="off"
        />
      </div>

      {showDropdown && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-line bg-bg-card shadow-glow">
          {results.map((q, i) => {
            const up = q.changePct >= 0;
            return (
              <li key={q.symbol}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(q.symbol)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left transition",
                    i === active ? "bg-bg-soft" : "hover:bg-bg-soft",
                  )}
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-100">{q.symbol}</span>
                    <span className="ml-2 truncate text-xs text-muted">{q.name}</span>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <span className="font-mono text-sm text-slate-100">${q.price.toFixed(2)}</span>
                    <span className={cn("ml-2 font-mono text-xs", up ? "text-bull" : "text-bear")}>
                      {fmtPct(q.changePct)}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
