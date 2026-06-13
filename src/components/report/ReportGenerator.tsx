"use client";

import { useState } from "react";
import ReportView, { type ReportData } from "@/components/report/ReportView";
import { REGIONS } from "@/lib/universe";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ReportGenerator — choose a report kind + scope, POST to
// /api/reports, then render the returned markdown via ReportView.
//
//   - "market"    → region select
//   - "symbol"    → ticker input
//   - "portfolio" → no scope (uses watchlist / demo basket)
//
// Demo-mode safe: the API never 500s and always returns a report.
// ─────────────────────────────────────────────────────────────

type Kind = "market" | "symbol" | "portfolio";

const KINDS: { id: Kind; label: string; hint: string }[] = [
  { id: "market", label: "Marché", hint: "Bilan d'une place boursière" },
  { id: "symbol", label: "Valeur", hint: "Note de recherche sur un titre" },
  { id: "portfolio", label: "Portefeuille", hint: "Revue de vos positions" },
];

export default function ReportGenerator() {
  const [kind, setKind] = useState<Kind>("market");
  const [region, setRegion] = useState<string>("US");
  const [symbol, setSymbol] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  const scope = kind === "symbol" ? symbol.trim().toUpperCase() : kind === "market" ? region : "";
  const canGenerate = !loading && (kind !== "symbol" || scope.length > 0);

  async function generate() {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, scope }),
      });
      const data = (await res.json()) as { report?: ReportData; error?: string };
      if (data.report) {
        setReport(data.report);
      } else {
        setError(data.error ?? "Impossible de générer le rapport. Réessayez.");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-4">
        {/* Kind selector */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left transition",
                kind === k.id
                  ? "border-brand bg-brand/10 shadow-glow"
                  : "border-line bg-bg-soft hover:border-brand/40",
              )}
              aria-pressed={kind === k.id}
            >
              <div className="text-sm font-semibold text-slate-100">{k.label}</div>
              <div className="text-xs text-muted">{k.hint}</div>
            </button>
          ))}
        </div>

        {/* Scope input */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {kind === "market" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Place boursière</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input min-w-[14rem]"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.flag} {r.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {kind === "symbol" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Symbole</span>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") generate();
                }}
                placeholder="AAPL, NVDA, NPN…"
                className="input min-w-[14rem] font-mono uppercase"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
          )}

          {kind === "portfolio" && (
            <p className="text-sm text-muted">
              Basé sur vos titres suivis (ou un panier de démonstration).
            </p>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Génération…" : "Générer"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-bear">{error}</p>}
      </div>

      {/* Loading skeleton */}
      {loading && !report && (
        <div className="card animate-pulse space-y-3 p-5">
          <div className="h-5 w-2/5 rounded bg-bg-elevated" />
          <div className="h-3 w-full rounded bg-bg-elevated" />
          <div className="h-3 w-11/12 rounded bg-bg-elevated" />
          <div className="h-3 w-3/4 rounded bg-bg-elevated" />
        </div>
      )}

      {report && <ReportView report={report} />}
    </div>
  );
}
