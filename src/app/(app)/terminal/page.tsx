import Terminal from "@/components/terminal/Terminal";

// ─────────────────────────────────────────────────────────────
// Mnemo Terminal — beta.
//
// A Bloomberg-style command surface, AI-native and interconnected:
// quotes, charts, comparisons, your watchlist, news and a direct
// line to the Mnemo copilot, all from one prompt. Works in demo
// mode with zero keys.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default function TerminalPage() {
  return (
    <div className="px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">
          Mnemo Terminal <span className="align-middle text-xs font-semibold text-brand">— beta</span>
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          One AI-native, interconnected command line for quotes, charts, your watchlist and
          live copilot answers — the Bloomberg terminal, minus the $24k/year bill.
        </p>
      </header>

      <div className="min-h-[72vh]">
        <Terminal />
      </div>
    </div>
  );
}
