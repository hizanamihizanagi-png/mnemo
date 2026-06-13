import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// VolatilityWidget — compact gauge of current market volatility.
// Pure presentational (no hooks): renders a horizontal bar whose
// fill and color reflect `value` (a ~0..72 volatility index), with
// the bucketed `label` shown alongside. Server-safe.
// ─────────────────────────────────────────────────────────────

const MAX = 72; // matches the upper clamp in getVolatility

// Color by severity: calm = bull green, mid = amber, high = bear red.
function toneFor(value: number): { bar: string; text: string } {
  if (value < 14) return { bar: "bg-bull", text: "text-bull" };
  if (value < 22) return { bar: "bg-brand", text: "text-brand" };
  if (value < 32) return { bar: "bg-[#f5c451]", text: "text-[#f5c451]" };
  return { bar: "bg-bear", text: "text-bear" };
}

export default function VolatilityWidget({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const pct = Math.max(2, Math.min(100, (value / MAX) * 100));
  const tone = toneFor(value);

  return (
    <div className={cn("card p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PulseIcon className={tone.text} />
          <span className="text-sm font-semibold text-slate-200">Volatilité du marché</span>
        </div>
        <span className={cn("font-mono text-lg font-bold tabular-nums", tone.text)}>
          {value.toFixed(1)}
        </span>
      </div>

      {/* Gauge bar */}
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-soft"
        role="meter"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-label="Indice de volatilité"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", tone.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted">Indice (jour)</span>
        <span className={cn("font-medium", tone.text)}>{label}</span>
      </div>
    </div>
  );
}

function PulseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </svg>
  );
}
