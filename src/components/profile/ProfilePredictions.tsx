import Link from "next/link";
import ReputationBadge from "@/components/social/ReputationBadge";
import SentimentBadge from "@/components/ui/SentimentBadge";
import type { Post, TrackRecord } from "@/lib/types";
import { cn, fmtPct, timeAgo } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ProfilePredictions — the trader's track record + their cashtagged
// "calls". Reputation compounds from being right, so this is the
// trust surface. Presentational (no hooks).
// ─────────────────────────────────────────────────────────────

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="card p-3 text-center">
      <p
        className={cn(
          "font-mono text-xl font-bold",
          tone === "up" ? "text-bull" : tone === "down" ? "text-bear" : "text-slate-100",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

export default function ProfilePredictions({
  trackRecord,
  posts,
}: {
  trackRecord: TrackRecord;
  posts: Post[];
}) {
  const calls = posts.filter((p) => p.cashtags.length > 0 && p.sentiment !== "neutral");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-slate-200">Track record</h2>
        <ReputationBadge tier={trackRecord.tier} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Accuracy" value={`${Math.round(trackRecord.accuracy * 100)}%`} tone="up" />
        <Metric
          label="Alpha"
          value={fmtPct(trackRecord.alpha)}
          tone={trackRecord.alpha >= 0 ? "up" : "down"}
        />
        <Metric label="Predictions" value={String(trackRecord.nPredictions)} />
        <Metric label="Resolved" value={String(trackRecord.nResolved)} />
      </div>

      <p className="px-1 text-xs leading-relaxed text-muted">
        Accuracy is the share of resolved calls that moved the predicted direction.
        Alpha is return vs. the benchmark. Build a public, verifiable record over time.
      </p>

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-200">Recent calls</h3>
        {calls.length === 0 ? (
          <div className="card p-5 text-center text-sm text-muted">No directional calls yet.</div>
        ) : (
          <ul className="space-y-2">
            {calls.map((p) => (
              <li key={p.id} className="card flex items-center gap-3 p-3">
                <SentimentBadge sentiment={p.sentiment} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {p.cashtags.map((sym) => (
                      <Link
                        key={sym}
                        href={`/markets/${sym}`}
                        className="font-mono text-sm font-bold text-brand hover:underline"
                      >
                        ${sym}
                      </Link>
                    ))}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{p.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">{timeAgo(p.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
