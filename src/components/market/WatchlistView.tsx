"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sparkline from "@/components/ui/Sparkline";
import { useSession } from "@/components/auth/SessionProvider";
import { REGIONS, lookupAny } from "@/lib/universe";
import type { Quote, Region } from "@/lib/types";
import { cn, fmtMoney, fmtPct } from "@/lib/utils";
import type { WatchlistEntry } from "@/lib/data/watchlist";

// ─────────────────────────────────────────────────────────────
// WatchlistView — "Mes listes" by zone (Slice W, client side).
//
// Rows are grouped under region headers ("zones") using the REGIONS
// flag + label. Each row shows symbol → /markets/SYM, name, price,
// colored change %, and an area sparkline of recent closes.
//
// Add box: debounced /api/market/search suggestions → add via
// POST /api/watchlist. Remove via DELETE /api/watchlist?symbol=.
// All mutations are optimistic. In demo / signed-out mode the list
// is local-only (no persistence) with a subtle "Connecte-toi…" hint.
// ─────────────────────────────────────────────────────────────

// Region display order follows the canonical REGIONS list.
const REGION_ORDER: Region[] = REGIONS.map((r) => r.id);

export default function WatchlistView({ initial }: { initial: WatchlistEntry[] }) {
  const { user, configured } = useSession();
  // Signed-in & Supabase configured ⇒ changes persist server-side.
  const persists = configured && Boolean(user);

  const [entries, setEntries] = useState<WatchlistEntry[]>(initial);
  const [notice, setNotice] = useState<string | null>(null);

  const symbolsInList = useMemo(
    () => new Set(entries.map((e) => e.quote.symbol)),
    [entries],
  );

  // ── Add a symbol (optimistic) ──────────────────────────────
  const addSymbol = useCallback(
    async (rawSymbol: string) => {
      const symbol = rawSymbol.trim().toUpperCase();
      if (!symbol || symbolsInList.has(symbol)) return;

      // Optimistic placeholder so the row appears instantly; we fill
      // in the real quote + closes from the API right after.
      const meta = lookupAny(symbol);
      const placeholder: WatchlistEntry = {
        quote: {
          symbol,
          name: meta?.name ?? symbol,
          price: 0,
          change: 0,
          changePct: 0,
          open: 0,
          high: 0,
          low: 0,
          prevClose: 0,
          currency: meta?.currency ?? "USD",
          sector: meta?.sector ?? "—",
        },
        closes: [],
        region: meta?.region ?? "US",
      };
      setEntries((prev) => [placeholder, ...prev]);

      // Persist (signed-in) — fire and forget; revert on failure.
      if (persists) {
        try {
          const res = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol }),
            cache: "no-store",
          });
          const data = (await res.json()) as { ok?: boolean; error?: string };
          if (!data.ok) {
            setEntries((prev) => prev.filter((e) => e.quote.symbol !== symbol));
            setNotice(data.error ?? "Impossible d'ajouter, réessaie.");
            return;
          }
        } catch {
          setEntries((prev) => prev.filter((e) => e.quote.symbol !== symbol));
          setNotice("Erreur réseau, réessaie.");
          return;
        }
      } else {
        setNotice("Connecte-toi pour sauvegarder.");
      }

      // Fetch the real quote to replace the placeholder.
      try {
        const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as { quote: Quote | null };
        if (data.quote) {
          const quote = data.quote;
          setEntries((prev) =>
            prev.map((e) =>
              e.quote.symbol === symbol
                ? { quote, closes: e.closes, region: lookupAny(symbol)?.region ?? e.region }
                : e,
            ),
          );
        }
      } catch {
        // Keep the placeholder; the price simply stays at 0 until reload.
      }
    },
    [persists, symbolsInList],
  );

  // ── Remove a symbol (optimistic) ───────────────────────────
  const removeSymbol = useCallback(
    async (symbol: string) => {
      const prevEntries = entries;
      setEntries((prev) => prev.filter((e) => e.quote.symbol !== symbol));

      if (!persists) {
        setNotice("Connecte-toi pour sauvegarder.");
        return;
      }
      try {
        const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
          method: "DELETE",
          cache: "no-store",
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!data.ok) {
          setEntries(prevEntries); // Revert.
          setNotice(data.error ?? "Impossible de retirer, réessaie.");
        }
      } catch {
        setEntries(prevEntries); // Revert.
        setNotice("Erreur réseau, réessaie.");
      }
    },
    [entries, persists],
  );

  // Auto-dismiss the notice after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Group entries by region, in canonical zone order.
  const groups = useMemo(() => {
    const byRegion = new Map<Region, WatchlistEntry[]>();
    for (const e of entries) {
      const arr = byRegion.get(e.region) ?? [];
      arr.push(e);
      byRegion.set(e.region, arr);
    }
    return REGION_ORDER.map((id) => ({
      region: REGIONS.find((r) => r.id === id)!,
      rows: byRegion.get(id) ?? [],
    })).filter((g) => g.rows.length > 0);
  }, [entries]);

  return (
    <div className="flex flex-col gap-5">
      <AddBox onAdd={addSymbol} existing={symbolsInList} />

      {!persists && (
        <p className="text-xs text-muted">
          Connecte-toi pour sauvegarder tes listes.
        </p>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-line bg-bg-soft px-3 py-2 text-xs text-slate-300"
        >
          {notice}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          Ta liste est vide. Ajoute un symbole ci-dessus.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.region.id} className="card overflow-hidden p-0">
              <header className="flex items-center gap-2 border-b border-line bg-bg-soft px-4 py-2.5">
                <span aria-hidden className="text-base leading-none">
                  {g.region.flag}
                </span>
                <h2 className="text-sm font-bold text-slate-200">{g.region.label}</h2>
                <span className="ml-auto font-mono text-xs text-muted">{g.rows.length}</span>
              </header>
              <ul className="divide-y divide-line">
                {g.rows.map((e) => (
                  <WatchRow
                    key={e.quote.symbol}
                    entry={e}
                    onRemove={() => removeSymbol(e.quote.symbol)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ── A single watchlist row ───────────────────────────────────
function WatchRow({ entry, onRemove }: { entry: WatchlistEntry; onRemove: () => void }) {
  const { quote, closes } = entry;
  const up = quote.changePct >= 0;
  // Fall back to a flat-but-valid series so the sparkline still renders.
  const series = closes.length >= 2 ? closes : [quote.prevClose || quote.price, quote.price];

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition hover:bg-bg-soft">
      <Link
        href={`/markets/${quote.symbol}`}
        className="min-w-0 flex-1"
        aria-label={`Open ${quote.symbol}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-100">{quote.symbol}</span>
          <span className="truncate text-xs text-muted">{quote.name}</span>
        </div>
      </Link>

      <div className="hidden shrink-0 sm:block">
        <Sparkline data={series} up={up} area width={88} height={28} />
      </div>

      <div className="shrink-0 text-right">
        <div className="font-mono text-sm text-slate-100">
          {fmtMoney(quote.price, quote.currency)}
        </div>
        <div className={cn("font-mono text-xs", up ? "text-bull" : "text-bear")}>
          {fmtPct(quote.changePct)}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer ${quote.symbol}`}
        className="btn-ghost shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition hover:text-bear group-hover:opacity-100 focus:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}

// ── Debounced add box with search suggestions ────────────────
function AddBox({
  onAdd,
  existing,
}: {
  onAdd: (symbol: string) => void;
  existing: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Quote[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Debounced search.
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
        // Aborted / network error — ignore.
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

  function choose(symbol: string) {
    onAdd(symbol);
    setQuery("");
    setResults([]);
    setOpen(false);
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
        choose(chosen.symbol);
      } else if (/^[A-Za-z0-9.]{1,8}$/.test(query.trim())) {
        choose(query.trim());
      }
    }
  }

  const showDropdown = open && query.trim().length > 0 && results.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <PlusIcon />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Ajouter un symbole à ta liste…"
          className="input pl-9 font-mono"
          aria-label="Add a symbol to your watchlist"
          autoComplete="off"
        />
      </div>

      {showDropdown && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-line bg-bg-card shadow-glow">
          {results.map((q, i) => {
            const up = q.changePct >= 0;
            const added = existing.has(q.symbol);
            return (
              <li key={q.symbol}>
                <button
                  type="button"
                  disabled={added}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(q.symbol)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left transition",
                    added && "cursor-default opacity-50",
                    !added && (i === active ? "bg-bg-soft" : "hover:bg-bg-soft"),
                  )}
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-100">{q.symbol}</span>
                    <span className="ml-2 truncate text-xs text-muted">{q.name}</span>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <span className="font-mono text-sm text-slate-100">
                      {fmtMoney(q.price, q.currency)}
                    </span>
                    {added ? (
                      <span className="ml-2 font-mono text-xs text-muted">déjà ajouté</span>
                    ) : (
                      <span className={cn("ml-2 font-mono text-xs", up ? "text-bull" : "text-bear")}>
                        {fmtPct(q.changePct)}
                      </span>
                    )}
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

function PlusIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
