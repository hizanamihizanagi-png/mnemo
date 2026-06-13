import Link from "next/link";
import PostCard from "@/components/feed/PostCard";
import InsightPanel from "@/components/market/InsightPanel";
import PriceChart from "@/components/market/PriceChart";
import QuoteHeader from "@/components/market/QuoteHeader";
import TradeTicket from "@/components/trading/TradeTicket";
import { getFeed } from "@/lib/data/feed";
import { getMarketProvider } from "@/lib/market";
import { lookupAny } from "@/lib/universe";

// ─────────────────────────────────────────────────────────────
// Symbol detail — the full picture for one ticker.
//
// Two-column on lg: LEFT is the quote header, the candlestick chart,
// and the related-posts ("insights") rail; RIGHT (sticky) is the AI
// insight panel and the paper-trade ticket. All data comes from the
// market provider + feed, fetched in parallel. Unknown symbols get a
// graceful empty state with a route back to /markets.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function SymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();

  const market = getMarketProvider();
  const [quote, candles, posts] = await Promise.all([
    market.getQuote(symbol),
    market.getCandles(symbol, 120),
    getFeed({ symbol }),
  ]);

  const isIndex = lookupAny(symbol)?.isIndex ?? false;

  // Unknown symbol: no universe entry AND no quote → graceful state.
  if (!quote && !lookupAny(symbol)) {
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <p className="text-3xl font-black text-slate-100">{symbol}</p>
        <p className="mt-2 text-muted">We don&apos;t have data for that symbol.</p>
        <Link href="/markets" className="btn-primary mt-6 inline-flex">
          ← Back to markets
        </Link>
      </div>
    );
  }

  // Defensive: universe entry exists but quote came back null.
  if (!quote) {
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <p className="text-3xl font-black text-slate-100">{symbol}</p>
        <p className="mt-2 text-muted">Quote temporarily unavailable. Try again shortly.</p>
        <Link href="/markets" className="btn-primary mt-6 inline-flex">
          ← Back to markets
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6">
      <Link href="/markets" className="link-muted mb-4 inline-flex items-center gap-1 text-sm">
        ← Markets
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* LEFT column */}
        <div className="space-y-5 lg:col-span-2">
          <QuoteHeader quote={quote} />

          <div className="card overflow-hidden p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-200">Price history</h2>
            <PriceChart candles={candles} />
          </div>

          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-200">
              Insights on <span className="text-brand">${symbol}</span>
            </h2>
            {posts.length > 0 ? (
              <div className="card divide-y divide-line overflow-hidden">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center text-sm text-muted">
                <p>No posts about ${symbol} yet.</p>
                <Link href="/compose" className="mt-2 inline-block font-semibold text-brand hover:text-brand-glow">
                  Share the first insight →
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT column (sticky) */}
        <div className="space-y-5">
          <div className="lg:sticky lg:top-16 space-y-5">
            <InsightPanel symbol={symbol} />
            {isIndex ? (
              <div className="card p-4 text-sm text-muted">
                <p className="font-semibold text-slate-200">Market index</p>
                <p className="mt-1 leading-relaxed">
                  {quote.name} is an index — not directly tradable. Trade its constituents
                  from the markets table.
                </p>
              </div>
            ) : (
              <TradeTicket symbol={symbol} name={quote.name} price={quote.price} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
