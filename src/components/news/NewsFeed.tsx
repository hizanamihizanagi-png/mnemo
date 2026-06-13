"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import SentimentBadge from "@/components/ui/SentimentBadge";
import VolatilityWidget from "@/components/news/VolatilityWidget";
import type { NewsItem } from "@/lib/data/news";
import { cn, timeAgo } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// NewsFeed — the interactive news surface.
//
// Self-contained region selector (inline pills — intentionally NOT
// RegionTabs, to stay in-lane) that refetches GET /api/news?region=.
// Seeds from the server-rendered initial payload so first paint is
// instant and works even before any fetch resolves. Renders the
// VolatilityWidget for the active region above the headline cards.
// ─────────────────────────────────────────────────────────────

// Local copy of the region pill metadata. Kept inline rather than
// importing REGIONS so this client component owns its own selector.
const REGION_PILLS: { id: string; label: string; flag: string }[] = [
  { id: "US", label: "US", flag: "🇺🇸" },
  { id: "WAEMU", label: "BRVM", flag: "🌍" },
  { id: "ZA", label: "JSE", flag: "🇿🇦" },
  { id: "NG", label: "NGX", flag: "🇳🇬" },
  { id: "EG", label: "EGX", flag: "🇪🇬" },
  { id: "CEMAC", label: "BVMAC", flag: "🌍" },
];

interface Volatility {
  value: number;
  label: string;
}

export default function NewsFeed({
  initialRegion,
  initialNews,
  initialVolatility,
}: {
  initialRegion: string;
  initialNews: NewsItem[];
  initialVolatility: Volatility;
}) {
  const [region, setRegion] = useState(initialRegion);
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [volatility, setVolatility] = useState<Volatility>(initialVolatility);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the region we already have data for so we don't refetch the
  // server-seeded initial region on mount.
  const loadedRegion = useRef(initialRegion);
  // Guard against out-of-order responses when switching quickly.
  const requestId = useRef(0);

  const load = useCallback(async (target: string) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?region=${encodeURIComponent(target)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { news?: NewsItem[]; volatility?: Volatility };
      if (id !== requestId.current) return; // a newer request superseded this one
      setNews(data.news ?? []);
      setVolatility(data.volatility ?? { value: 0, label: "—" });
      loadedRegion.current = target;
    } catch {
      if (id !== requestId.current) return;
      setError("Impossible de charger les actualités.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Fetch when the region changes (skip the initial server-seeded one).
  useEffect(() => {
    if (region === loadedRegion.current) return;
    void load(region);
  }, [region, load]);

  return (
    <div className="space-y-4">
      <VolatilityWidget value={volatility.value} label={volatility.label} />

      {/* Region selector — owned by this component (inline pills). */}
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Région">
        {REGION_PILLS.map((r) => {
          const active = r.id === region;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRegion(r.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                active
                  ? "border-brand/50 bg-brand/10 text-brand"
                  : "border-line text-muted hover:bg-bg-soft hover:text-slate-200",
              )}
            >
              <span aria-hidden>{r.flag}</span>
              <span className="whitespace-nowrap">{r.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="card border-bear/40 p-4 text-sm text-bear">{error}</div>
      )}

      {/* Headline cards */}
      <ul className={cn("space-y-3 transition-opacity", loading && "opacity-60")}>
        {news.map((item) => (
          <li key={item.id}>
            <NewsCard item={item} />
          </li>
        ))}
      </ul>

      {!loading && news.length === 0 && !error && (
        <p className="px-1 py-8 text-center text-sm text-muted">
          Aucune actualité pour cette région.
        </p>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  // Link to the composer. We pass a `body` query param as a forward-
  // compatible prefill hint; the compose page currently ignores unknown
  // params (see integrator note), so this degrades gracefully today.
  const lead = item.symbols[0];
  const draft = lead ? `${item.headline} — $${lead} ` : `${item.headline} `;
  const composeHref = `/compose?body=${encodeURIComponent(draft)}`;

  return (
    <article className="card p-4 transition hover:border-line/80">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-bold leading-snug text-slate-100">{item.headline}</h3>
        <SentimentBadge sentiment={item.sentiment} className="shrink-0" />
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{item.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
        <span className="font-medium text-slate-300">{item.source}</span>
        <span aria-hidden>·</span>
        <time dateTime={item.created_at}>{timeAgo(item.created_at)}</time>

        {item.symbols.length > 0 && (
          <>
            <span aria-hidden>·</span>
            <span className="flex flex-wrap gap-1.5">
              {item.symbols.map((sym) => (
                <Link
                  key={sym}
                  href={`/markets/${sym}`}
                  className="font-mono font-bold text-brand hover:underline"
                >
                  ${sym}
                </Link>
              ))}
            </span>
          </>
        )}

        <Link
          href={composeHref}
          className="btn-ghost ml-auto px-2.5 py-1 text-xs"
        >
          Discuter
        </Link>
      </div>
    </article>
  );
}
