"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { cn, fmtCurrency } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TradeTicket — place a simulated buy/sell market order.
//
// Shared primitive: rendered on the stock detail page and the
// portfolio page. POSTs to /api/trade, which prices the order off the
// live/mock quote and persists against the user's paper portfolio.
// Unauthenticated users are routed to sign in. SIMULATED ONLY.
// ─────────────────────────────────────────────────────────────

type Side = "buy" | "sell";

export default function TradeTicket({
  symbol,
  name,
  price,
}: {
  symbol: string;
  name: string;
  price: number;
}) {
  const router = useRouter();
  const { user, configured } = useSession();

  const [side, setSide] = useState<Side>("buy");
  const [qty, setQty] = useState("1");
  const [status, setStatus] = useState<
    { kind: "idle" | "loading" } | { kind: "ok"; msg: string } | { kind: "error"; msg: string }
  >({ kind: "idle" });

  const quantity = Math.max(0, Math.floor(Number(qty) || 0));
  const estimated = quantity * price;

  if (!configured) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-bold text-slate-200">Paper trade {symbol}</h3>
        <p className="mt-2 text-sm text-muted">
          Demo mode — connect Supabase to enable paper trading accounts.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-bold text-slate-200">Paper trade {symbol}</h3>
        <p className="mt-2 text-sm text-muted">Sign in to trade with $100k in virtual cash.</p>
        <Link href={`/login?next=/markets/${symbol}`} className="btn-primary mt-3 w-full">
          Sign in to trade
        </Link>
      </div>
    );
  }

  async function submit() {
    if (quantity <= 0) {
      setStatus({ kind: "error", msg: "Enter a whole number of shares." });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, side, quantity }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus({ kind: "error", msg: data.error ?? "Order rejected." });
        return;
      }
      setStatus({
        kind: "ok",
        msg: `${side === "buy" ? "Bought" : "Sold"} ${quantity} ${symbol} @ ${fmtCurrency(
          data.fillPrice ?? price,
        )}`,
      });
      router.refresh();
    } catch {
      setStatus({ kind: "error", msg: "Network error — try again." });
    }
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold text-slate-200">
        Paper trade <span className="text-brand">{symbol}</span>
      </h3>
      <p className="mt-0.5 text-xs text-muted">{name}</p>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-bg-soft p-1">
        {(["buy", "sell"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "rounded-lg py-1.5 text-sm font-semibold capitalize transition",
              side === s
                ? s === "buy"
                  ? "bg-bull text-bg"
                  : "bg-bear text-bg"
                : "text-muted hover:text-slate-200",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="mt-3 block text-xs font-medium text-muted">Shares</label>
      <input
        type="number"
        min={1}
        step={1}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="input mt-1 font-mono"
        inputMode="numeric"
      />

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">Market price</span>
        <span className="font-mono text-slate-200">{fmtCurrency(price)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-muted">Estimated {side === "buy" ? "cost" : "proceeds"}</span>
        <span className="font-mono font-semibold text-slate-100">{fmtCurrency(estimated)}</span>
      </div>

      <button
        onClick={submit}
        disabled={status.kind === "loading"}
        className={cn(
          "btn mt-4 w-full text-bg",
          side === "buy" ? "bg-bull hover:opacity-90" : "bg-bear hover:opacity-90",
        )}
      >
        {status.kind === "loading"
          ? "Placing…"
          : `${side === "buy" ? "Buy" : "Sell"} ${quantity || 0} ${symbol}`}
      </button>

      {status.kind === "ok" && (
        <p className="mt-2 rounded-lg bg-bull/10 px-3 py-2 text-xs text-bull">{status.msg}</p>
      )}
      {status.kind === "error" && (
        <p className="mt-2 rounded-lg bg-bear/10 px-3 py-2 text-xs text-bear">{status.msg}</p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Simulated order. No real securities are traded.
      </p>
    </div>
  );
}
