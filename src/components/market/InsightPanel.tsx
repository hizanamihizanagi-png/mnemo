"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SentimentBadge from "@/components/ui/SentimentBadge";
import { useSession } from "@/components/auth/SessionProvider";
import type { Insight } from "@/lib/types";
import { cn, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// InsightPanel — auto-fetches an AI insight for the symbol.
//
// On mount (and on "Regenerate") it GETs /api/insight?symbol=…,
// shows a skeleton while loading, then renders the structured
// insight: summary, sentiment, a prediction block, drivers, a risk
// line, and the disclaimer. Errors degrade gracefully with retry.
// ─────────────────────────────────────────────────────────────

const HORIZON_LABEL: Record<string, string> = {
  "1d": "1 day",
  "1w": "1 week",
  "1m": "1 month",
  "3m": "3 months",
};

export default function InsightPanel({ symbol }: { symbol: string }) {
  const router = useRouter();
  const { user, configured } = useSession();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logState, setLogState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [logMsg, setLogMsg] = useState<string | null>(null);

  const logCall = useCallback(async () => {
    if (!insight) return;
    if (!configured || !user) {
      router.push(`/login?next=/markets/${symbol}`);
      return;
    }
    setLogState("saving");
    setLogMsg(null);
    try {
      const p = insight.prediction;
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          symbol,
          direction: p.direction,
          targetPct: p.targetPct,
          confidence: p.confidence,
          horizon: p.horizon,
          rationale: p.rationale,
          model: p.model,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { saved?: boolean; demo?: boolean; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not save");
      if (data?.demo) {
        setLogState("idle");
        setLogMsg("Connect an account to save calls to your ledger.");
        return;
      }
      setLogState("saved");
      setLogMsg("Logged — we'll score it when the horizon passes.");
    } catch (e) {
      setLogState("error");
      setLogMsg(e instanceof Error ? e.message : "Could not save.");
    }
  }, [insight, configured, user, router, symbol]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/insight?symbol=${encodeURIComponent(symbol)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to generate insight.");
      }
      const data = (await res.json()) as { insight: Insight };
      setInsight(data.insight);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setInsight(null);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <SparkIcon />
          AI insight
        </h3>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="btn-ghost px-3 py-1 text-xs"
        >
          {loading ? "Thinking…" : "Regenerate"}
        </button>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-3 rounded-xl border border-bear/30 bg-bear/10 px-3 py-3 text-sm text-bear">
          <p>{error}</p>
          <button onClick={() => void load()} className="mt-2 text-xs font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && insight && (
        <div className="mt-3 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed text-slate-200">{insight.summary}</p>
            <SentimentBadge sentiment={insight.sentiment} className="shrink-0" />
          </div>

          <PredictionBlock insight={insight} />

          {/* Log to ledger — the bridge from insight to a verified record. */}
          <div>
            <button
              onClick={() => void logCall()}
              disabled={logState === "saving" || logState === "saved"}
              className="btn-primary w-full"
            >
              {logState === "saved"
                ? "Logged to your ledger"
                : logState === "saving"
                  ? "Logging…"
                  : "Log this call"}
            </button>
            {logMsg && (
              <p
                className={cn(
                  "mt-1.5 text-xs leading-relaxed",
                  logState === "error" ? "text-bear" : "text-muted",
                )}
                role="status"
                aria-live="polite"
              >
                {logMsg}
              </p>
            )}
          </div>

          {insight.bullets.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Drivers</p>
              <ul className="mt-1.5 space-y-1">
                {insight.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Risk</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{insight.prediction.risk}</p>
          </div>

          <p className="text-[11px] leading-relaxed text-muted">{insight.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

function PredictionBlock({ insight }: { insight: Insight }) {
  const { prediction } = insight;
  const up = prediction.direction === "up";
  return (
    <div className="rounded-xl border border-line bg-bg-soft/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          {HORIZON_LABEL[prediction.horizon] ?? prediction.horizon} forecast
        </span>
        <span className={cn("font-mono text-sm font-bold", up ? "text-bull" : "text-bear")}>
          {up ? "▲" : "▼"} {fmtPct(prediction.targetPct)}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Confidence</span>
          <span className="font-mono text-slate-200">
            {(prediction.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
          <div
            className={cn("h-full rounded-full", up ? "bg-bull" : "bg-bear")}
            style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted">{prediction.rationale}</p>
      <p className="mt-2 text-[11px] text-muted">Model: {prediction.model}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-3 animate-pulse space-y-3">
      <div className="h-4 w-full rounded bg-bg-elevated" />
      <div className="h-4 w-4/5 rounded bg-bg-elevated" />
      <div className="h-20 w-full rounded-xl bg-bg-elevated" />
      <div className="h-3 w-3/4 rounded bg-bg-elevated" />
      <div className="h-3 w-2/3 rounded bg-bg-elevated" />
    </div>
  );
}

function SparkIcon() {
  return (
    <svg className="h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}
