import ReportGenerator from "@/components/report/ReportGenerator";

// ─────────────────────────────────────────────────────────────
// Rapports — AI-composed research reports.
//
// Pick a kind (market / symbol / portfolio) and scope, then generate
// a structured markdown report (Summary, Key levels, Drivers, Risks,
// Outlook). Works fully in demo mode — the API never 500s and falls
// back to deterministic templated reports when the AI is unavailable.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  return (
    <div className="px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">Memos</h1>
        <p className="mt-0.5 text-sm text-muted">
          Generate a structured research memo — market, symbol or portfolio — composed by AI. Export
          or print in one click.
        </p>
      </header>

      <ReportGenerator />
    </div>
  );
}
