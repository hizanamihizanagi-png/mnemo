import type { Sentiment } from "@/lib/types";
import { cn } from "@/lib/utils";

// Small colored pill encoding bullish / bearish / neutral sentiment.
// Shared across the feed, the composer, and AI insight panels.
const STYLES: Record<Sentiment, { label: string; cls: string; arrow: string }> = {
  bullish: { label: "Bullish", cls: "border-bull/40 bg-bull/10 text-bull", arrow: "▲" },
  bearish: { label: "Bearish", cls: "border-bear/40 bg-bear/10 text-bear", arrow: "▼" },
  neutral: { label: "Neutral", cls: "border-line bg-bg-soft text-muted", arrow: "◆" },
};

export default function SentimentBadge({
  sentiment,
  className,
}: {
  sentiment: Sentiment;
  className?: string;
}) {
  const s = STYLES[sentiment];
  return (
    <span className={cn("chip", s.cls, className)}>
      <span aria-hidden>{s.arrow}</span>
      {s.label}
    </span>
  );
}
