import NewsFeed from "@/components/news/NewsFeed";
import { getNews, getVolatility } from "@/lib/data/news";

// ─────────────────────────────────────────────────────────────
// Actualités & volatilité — economic news feed + a volatility gauge.
//
// Server component: renders the initial (US) news + volatility so the
// page is populated on first paint, then hands off to the client
// NewsFeed which owns the region selector and refetches per region.
// Deterministic per day — no env vars required (demo-safe).
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const INITIAL_REGION = "US";

export default async function NewsPage() {
  const [news, volatility] = await Promise.all([
    getNews(INITIAL_REGION),
    Promise.resolve(getVolatility(INITIAL_REGION)),
  ]);

  return (
    <div className="px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">
          Actualités &amp; volatilité
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Macro et marchés par région — Fed, BCEAO, SARB, CBN, EGX — avec un indice
          de volatilité du jour. Cliquez « Discuter » pour publier votre avis.
        </p>
      </header>

      <div className="max-w-2xl">
        <NewsFeed
          initialRegion={INITIAL_REGION}
          initialNews={news}
          initialVolatility={volatility}
        />
      </div>
    </div>
  );
}
