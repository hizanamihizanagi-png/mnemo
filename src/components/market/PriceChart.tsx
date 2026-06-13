"use client";

import {
  ColorType,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// PriceChart — candlestick chart for a symbol's recent history.
//
// Wraps lightweight-charts (v4) imperatively. The chart is created
// once on mount, fed the candle series, and torn down on unmount.
// A ResizeObserver keeps it sized to its container. Styled for the
// dark finance-terminal theme. Candle.time is already unix seconds.
// ─────────────────────────────────────────────────────────────

const HEIGHT = 320;

export default function PriceChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart: IChartApi = createChart(container, {
      width: container.clientWidth,
      height: HEIGHT,
      layout: {
        background: { type: ColorType.Solid, color: "#0d1220" },
        textColor: "#7b8aa5",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(30, 41, 59, 0.5)" },
        horzLines: { color: "rgba(30, 41, 59, 0.5)" },
      },
      rightPriceScale: { borderColor: "#1e293b" },
      timeScale: { borderColor: "#1e293b", timeVisible: false },
      crosshair: { mode: 0 },
      handleScale: { mouseWheel: false },
    });

    const series: ISeriesApi<"Candlestick"> = chart.addCandlestickSeries({
      upColor: "#16c784",
      downColor: "#ea3943",
      borderUpColor: "#16c784",
      borderDownColor: "#ea3943",
      wickUpColor: "#16c784",
      wickDownColor: "#ea3943",
    });

    const data: CandlestickData<UTCTimestamp>[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(data);
    chart.timeScale().fitContent();

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [candles]);

  return <div ref={containerRef} className="w-full" style={{ height: HEIGHT }} />;
}
