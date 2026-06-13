"use client";

import { useId } from "react";

// Tiny inline SVG sparkline. No dependencies, SSR-safe.
export default function Sparkline({
  data,
  width = 80,
  height = 24,
  up,
  area = false,
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  up?: boolean;
  // Draw a soft gradient fill under the line.
  area?: boolean;
  strokeWidth?: number;
}) {
  const gradId = useId();
  if (!data || data.length < 2) {
    return <svg width={width} height={height} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const coords = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d - min) / range) * height;
    return [x, y] as const;
  });
  const points = coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const rising = up ?? data[data.length - 1] >= data[0];
  const color = rising ? "#16c784" : "#ea3943";

  // Closed path for the area fill (line + drop to baseline).
  const areaPath =
    `M ${coords[0][0].toFixed(2)},${coords[0][1].toFixed(2)} ` +
    coords
      .slice(1)
      .map(([x, y]) => `L ${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ") +
    ` L ${coords[coords.length - 1][0].toFixed(2)},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {area && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        </>
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
