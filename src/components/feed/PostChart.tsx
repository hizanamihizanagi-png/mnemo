"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MiniChart from "@/components/ui/MiniChart";
import type { Candle, Quote } from "@/lib/types";
import { cn, fmtMoney, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// PostChart — a compact inline price card attached to a post.
//
// Rendered under a post body when the post carries a cashtag. Fetches a
// short candle window + the latest quote from the market API (which is
// graceful in demo mode), draws a MiniChart, and links the symbol to its
// market page. Collapsible; renders nothing when there's no data.
// ─────────────────────────────────────────────────────────────

export default function PostChart({ symbol }: { symbol: string }) {
  const sym = symbol.toUpperCase();
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`/api/market/candles?symbol=${encodeURIComponent(sym)}&days=40`)
        .then((r) => r.json())
        .catch(() => ({ candles: [] })),
      fetch(`/api/market/quote?symbol=${encodeURIComponent(sym)}`)
        .then((r) => r.json())
        .catch(() => ({ quote: null })),
    ])
      .then(([c, q]) => {
        if (cancelled) return;
        setCandles(Array.isArray(c?.candles) ? c.candles : []);
        setQuote(q?.quote ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setCandles([]);
        setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sym]);

  // Slim skeleton while the first fetch is in flight.
  if (loading) {
    return (
      <div className="mt-2 rounded-xl border border-line bg-bg-soft/40 p-2">
        <div className="mb-2 h-3 w-28 animate-pulse rounded bg-bg-elevated" />
        <div className="h-12 w-full animate-pulse rounded bg-bg-elevated" />
      </div>
    );
  }

  // Nothing to show — bail rather than render an empty frame.
  if (candles.length < 2) return null;

  const closes = candles.map((c) => c.close);
  const up = quote ? quote.changePct >= 0 : closes[closes.length - 1] >= closes[0];

  return (
    <div
      className="mt-2 rounded-xl border border-line bg-bg-soft/40 p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={`/markets/${sym}`}
          className="font-semibold text-brand hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          ${sym}
        </Link>

        {quote && (
          <>
            <span className="font-mono text-slate-200">
              {fmtMoney(quote.price, quote.currency)}
            </span>
            <span className={cn("font-mono text-xs", up ? "text-bull" : "text-bear")}>
              {fmtPct(quote.changePct)}
            </span>
          </>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="ml-auto text-xs text-muted transition hover:text-slate-200"
          aria-expanded={open}
        >
          {open ? "hide chart" : "chart"}
        </button>
      </div>

      {open && (
        <div className="mt-1.5">
          <MiniChart data={closes} up={up} height={56} />
        </div>
      )}
    </div>
  );
}
