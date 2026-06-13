import { getCurrentUser } from "@/lib/supabase/server";
import { getPortfolio, getTrades } from "@/lib/data/portfolio";
import PortfolioSummary from "@/components/trading/PortfolioSummary";
import PositionsTable from "@/components/trading/PositionsTable";
import TradesList from "@/components/trading/TradesList";
import PortfolioEmpty from "@/components/trading/PortfolioEmpty";

// ─────────────────────────────────────────────────────────────
// Portfolio — the user's paper-trading account. Equity hero,
// open positions marked to market, and trade history. Auth-gated
// by middleware; still degrades gracefully in demo / signed-out.
// SIMULATED ONLY.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />
        <div className="mt-5">
          <PortfolioEmpty />
        </div>
      </div>
    );
  }

  const [portfolio, trades] = await Promise.all([
    getPortfolio(user.id),
    getTrades(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Header />
      <div className="mt-5 flex flex-col gap-5">
        <PortfolioSummary portfolio={portfolio} />
        <PositionsTable positions={portfolio.positions} />
        <TradesList trades={trades} />
      </div>
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1 className="text-2xl font-black tracking-tight">Portfolio</h1>
      <p className="mt-1 text-sm text-muted">
        Your simulated paper-trading account, marked to live prices.
      </p>
    </header>
  );
}
