"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import type { Strategy } from "@/lib/strategy/engine";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// StrategyList — the signed-in user's saved strategies.
//
// Live: fetches GET /api/strategies. Demo / signed-out: shows two
// clearly-labelled EXAMPLE strategies so the surface never looks
// empty. Each row carries a status chip (Live / Paper / Example)
// and a delete action for owned rows.
// ─────────────────────────────────────────────────────────────

// Example strategies for demo mode — clearly marked "exemple".
const EXAMPLE_STRATEGIES: (Strategy & { _status: "example" })[] = [
  {
    id: "example-1",
    name: "AAPL dip buyer (example)",
    symbol: "AAPL",
    capital: 10000,
    entry: { kind: "pctDrop", value: 5 },
    exit: [
      { kind: "takeProfit", value: 8 },
      { kind: "stopLoss", value: 4 },
    ],
    interval: "1d",
    _status: "example",
  },
  {
    id: "example-2",
    name: "Sonatel momentum (example)",
    symbol: "SNTS",
    capital: 500000,
    entry: { kind: "smaCross", value: 20 },
    exit: [{ kind: "takeProfit", value: 12 }],
    interval: "1w",
    _status: "example",
  },
];

const RULE_LABELS: Record<string, string> = {
  pctDrop: "drop",
  pctRise: "rise",
  smaCross: "SMA cross",
  stopLoss: "stop",
  takeProfit: "target",
};

function ruleText(r: { kind: string; value: number }): string {
  const label = RULE_LABELS[r.kind] ?? r.kind;
  const unit = r.kind === "smaCross" ? "" : "%";
  return `${label} ${r.value}${unit}`;
}

type Row = Strategy & { _status?: "example" };

export default function StrategyList() {
  const router = useRouter();
  const { user, configured, loading: sessionLoading } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const live = configured && Boolean(user);

  useEffect(() => {
    if (sessionLoading) return;
    let cancelled = false;

    if (!live) {
      setRows(EXAMPLE_STRATEGIES);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/strategies");
        const data = await res.json();
        if (cancelled) return;
        const list = (data.strategies ?? []) as Strategy[];
        setRows(list.length ? list : EXAMPLE_STRATEGIES);
      } catch {
        if (!cancelled) setRows(EXAMPLE_STRATEGIES);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [live, sessionLoading]);

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/strategies?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setRows((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
        router.refresh();
      }
    } catch {
      // Leave the row in place on failure.
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card p-4 sm:p-5">
      <h2 className="text-sm font-bold text-slate-200">Your strategies</h2>

      {rows === null ? (
        <p className="mt-3 text-xs text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted">No strategies yet — build one above.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((s) => {
            const isExample = s._status === "example";
            return (
              <li
                key={s.id ?? s.name}
                className="flex items-start justify-between gap-3 rounded-xl bg-bg-soft px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-100">
                      {s.name}
                    </span>
                    <StatusChip status={isExample ? "example" : "paper"} />
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    <span className="font-mono text-slate-300">{s.symbol}</span> · entry{" "}
                    {ruleText(s.entry)}
                    {s.exit.length > 0 && <> · exit {s.exit.map(ruleText).join(", ")}</>} ·{" "}
                    {s.interval === "1w" ? "weekly" : "daily"}
                  </p>
                </div>
                {!isExample && s.id && (
                  <button
                    onClick={() => remove(s.id as string)}
                    disabled={busyId === s.id}
                    className="link-muted shrink-0 text-xs hover:text-bear"
                  >
                    {busyId === s.id ? "…" : "Delete"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!live && (
        <p className="mt-3 text-[11px] text-muted">
          Showing examples. {configured ? "Sign in" : "Connect Supabase"} to save your own
          strategies.
        </p>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: "example" | "paper" | "live" }) {
  const map = {
    example: { label: "Example", cls: "bg-bg-elevated text-muted" },
    paper: { label: "Paper", cls: "bg-brand/15 text-brand" },
    live: { label: "Live", cls: "bg-bull/15 text-bull" },
  } as const;
  const { label, cls } = map[status];
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        cls,
      )}
    >
      {label}
    </span>
  );
}
