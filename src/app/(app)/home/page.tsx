import PostCard from "@/components/feed/PostCard";
import Composer from "@/components/feed/Composer";
import { getFeed } from "@/lib/data/feed";

// ─────────────────────────────────────────────────────────────
// Home — the main feed. Server-renders the latest insights (live
// rows when Supabase is configured, the curated demo feed otherwise)
// with a compact composer pinned to the top.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getFeed();

  return (
    <div>
      {/* Page header */}
      <header className="sticky top-[37px] z-10 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-black tracking-tight text-slate-100">Home</h1>
        <p className="text-xs text-muted">Latest insights</p>
      </header>

      {/* Composer */}
      <div className="border-b border-line">
        <Composer compact />
      </div>

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-base font-semibold text-slate-200">No insights yet</p>
          <p className="max-w-xs text-sm text-muted">
            Be the first to share a market thesis. Tag tickers with $SYMBOL and
            pick a sentiment.
          </p>
        </div>
      ) : (
        <div>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
