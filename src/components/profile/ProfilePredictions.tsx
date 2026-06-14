import Link from "next/link";
import ReputationBadge from "@/components/social/ReputationBadge";
import type { PredictionRecord, PredictionStatus, TrackRecord } from "@/lib/types";
import { cn, fmtPct, timeAgo } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ProfilePredictions — the verifiable track record + the prediction
// ledger. Each call carries an entry, a target and a timeline, and
// resolves to Hit / Miss once its horizon passes. Reputation is
// computed from these outcomes, not from volume. Presentational.
// ─────────────────────────────────────────────────────────────

const HORIZON_LABEL: Record<PredictionRecord["horizon"], string> = {
  "1d": "1 day",
  "1w": "1 week",
  "1m": "1 month",
  "3m": "3 months",
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

const STATUS_STYLE: Record<PredictionStatus, string> = {
  open: "border-line text-muted",
  hit: "border-bull/40 bg-bull/10 text-bull",
  missed: "border-bear/40 bg-bear/10 text-bear",
};
const STATUS_LABEL: Record<PredictionStatus, string> = {
  open: "Open",
  hit: "Hit",
  missed: "Miss",
};

function StatusPill({ status }: { status: PredictionStatus }) {
  return (
    <span className={cn("chip shrink-0", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>
  );
}

export default function ProfilePredictions({
  trackRecord,
  records,
}: {
  trackRecord: TrackRecord;
  records: PredictionRecord[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-slate-200">Track record</h2>
        <ReputationBadge tier={trackRecord.tier} accuracy={trackRecord.accuracy} size="sm" />
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
        Accuracy is the share of resolved calls that moved the predicted direction;
        alpha is return vs. the benchmark. Tiers apply a sample-size penalty — fewer
        than 10 resolved calls stays Rookie, so a record has to be earned.
      </p>

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-200">Prediction ledger</h3>
        {records.length === 0 ? (
          <div className="card p-5 text-center text-sm text-muted">No calls logged yet.</div>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => {
              const up = r.direction === "up";
              return (
                <li key={r.id} className="card flex items-center gap-3 p-3">
                  <StatusPill status={r.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/markets/${r.symbol}`}
                        className="font-mono text-sm font-bold text-brand hover:underline"
                      >
                        ${r.symbol}
                      </Link>
                      <span
                        className={cn(
                          "font-mono text-xs font-semibold",
                          up ? "text-bull" : "text-bear",
                        )}
                      >
                        {up ? "▲" : "▼"} {fmtPct(r.targetPct)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      Entry <span className="font-mono">${r.entryPrice.toFixed(2)}</span> ·{" "}
                      {HORIZON_LABEL[r.horizon]} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {r.status === "open" ? (
                      <span className="text-xs text-muted">Resolves {shortDate(r.resolvesAt)}</span>
                    ) : (
                      <span
                        className={cn(
                          "font-mono text-sm font-semibold",
                          (r.realizedPct ?? 0) >= 0 ? "text-bull" : "text-bear",
                        )}
                      >
                        {fmtPct(r.realizedPct ?? 0)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
