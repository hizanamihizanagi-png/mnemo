import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import ReputationBadge from "@/components/social/ReputationBadge";
import FollowButton from "@/components/social/FollowButton";
import ExploreSearch, { type SearchEntry } from "@/components/feed/ExploreSearch";
import { getFeed } from "@/lib/data/feed";
import { getServerSupabase } from "@/lib/supabase/server";
import { DEMO_PROFILES } from "@/lib/data/demo";
import type { Profile } from "@/lib/types";
import { UNIVERSE } from "@/lib/universe";
import { fmtCompact } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Explore — discovery surface. Trending cashtags are computed from
// the frequency of $symbols across the recent feed; "who to follow"
// surfaces traders (live profiles or the demo set); and a client
// search box filters the ticker universe. Fully self-contained.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

async function getSuggestedTraders(): Promise<Profile[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return Object.values(DEMO_PROFILES);
  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (!data || data.length === 0) return Object.values(DEMO_PROFILES);
  return data as Profile[];
}

export default async function ExplorePage() {
  const [posts, traders] = await Promise.all([
    getFeed({ limit: 50 }),
    getSuggestedTraders(),
  ]);

  // Trending cashtags by frequency across the recent feed.
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const tag of p.cashtags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const trending = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const universe: SearchEntry[] = UNIVERSE.map((u) => ({
    symbol: u.symbol,
    name: u.name,
    sector: u.sector,
  }));

  return (
    <div>
      {/* Page header */}
      <header className="sticky top-[37px] z-10 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-black tracking-tight text-slate-100">Explore</h1>
        <p className="text-xs text-muted">Trending tickers, traders, and markets</p>
      </header>

      <div className="space-y-6 p-4">
        {/* Search */}
        <ExploreSearch universe={universe} />

        {/* Trending cashtags */}
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-200">Trending cashtags</h2>
          {trending.length === 0 ? (
            <p className="text-sm text-muted">No trends yet — post an insight to get things moving.</p>
          ) : (
            <ul className="space-y-1">
              {trending.map(([sym, n], i) => (
                <li key={sym}>
                  <Link
                    href={`/markets/${sym}`}
                    className="-mx-2 flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-bg-soft"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-4 font-mono text-xs text-muted">{i + 1}</span>
                      <span className="font-mono text-sm font-bold text-brand">${sym}</span>
                    </div>
                    <span className="text-xs text-muted">
                      {fmtCompact(n)} {n === 1 ? "post" : "posts"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Who to follow */}
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-200">Who to follow</h2>
          <ul className="space-y-3">
            {traders.map((t) => (
              <li key={t.id} className="flex items-start gap-3">
                <Link href={`/user/${t.handle}`} className="shrink-0">
                  <Avatar handle={t.handle} src={t.avatar_url} size={44} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/user/${t.handle}`} className="flex items-center gap-2 hover:underline">
                    <span className="truncate text-sm font-bold text-slate-100">
                      {t.display_name}
                    </span>
                    <ReputationBadge handle={t.handle} size="sm" />
                  </Link>
                  <p className="text-xs text-muted">@{t.handle}</p>
                  {t.bio && (
                    <p className="mt-0.5 truncate text-xs text-muted">{t.bio}</p>
                  )}
                </div>
                <FollowButton handle={t.handle} size="sm" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
