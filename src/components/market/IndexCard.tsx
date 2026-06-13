import Link from "next/link";
import Sparkline from "@/components/ui/Sparkline";
import { cn, fmtMoney, fmtPct } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// IndexCard — a clickable market-index tile with a sparkline.
// Used in the markets page index strip. Links to the index detail page.
// ─────────────────────────────────────────────────────────────

export default function IndexCard({
  index,
  closes,
}: {
  index: { symbol: string; name: string; value: number; changePct: number; currency: string };
  closes?: number[];
}) {
  const up = index.changePct >= 0;
  return (
    <Link
      href={`/markets/${index.symbol}`}
      className="flex min-w-[160px] flex-1 items-center justify-between gap-3 rounded-xl border border-line bg-bg-card/60 px-3 py-2.5 transition hover:border-brand/50"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-200">{index.symbol}</p>
        <p className="truncate text-xs text-muted">{index.name}</p>
        <p className="mt-0.5 font-mono text-sm text-slate-100">
          {fmtMoney(index.value, index.currency)}
        </p>
        <p className={cn("font-mono text-xs", up ? "text-bull" : "text-bear")}>
          {up ? "▲" : "▼"} {fmtPct(index.changePct)}
        </p>
      </div>
      {closes && closes.length > 1 && (
        <Sparkline data={closes} width={64} height={36} up={up} area />
      )}
    </Link>
  );
}
