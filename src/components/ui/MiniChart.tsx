"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

// Richer area sparkline meant to sit under cards / headers. Pure SVG,
// no dependencies, responsive width via viewBox. Graceful empty state.
export default function MiniChart({
  data,
  up,
  height = 48,
  className,
}: {
  data: number[];
  up?: boolean;
  height?: number;
  className?: string;
}) {
  const gradId = useId();
  const width = 240; // viewBox width; scales to the container.

  if (!data || data.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={cn("w-full", className)}
        style={{ height }}
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const coords = data.map((d, i) => {
    const x = i * stepX;
    // Inset 2px top/bottom so the stroke isn't clipped.
    const y = 2 + (height - 4) - ((d - min) / range) * (height - 4);
    return [x, y] as const;
  });
  const line =
    `M ${coords[0][0].toFixed(2)},${coords[0][1].toFixed(2)} ` +
    coords
      .slice(1)
      .map(([x, y]) => `L ${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");
  const areaPath = `${line} L ${width},${height} L 0,${height} Z`;

  const rising = up ?? data[data.length - 1] >= data[0];
  const color = rising ? "#16c784" : "#ea3943";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
