"use client";

// Tiny inline SVG sparkline. No dependencies, SSR-safe.
export default function Sparkline({
  data,
  width = 80,
  height = 24,
  up,
}: {
  data: number[];
  width?: number;
  height?: number;
  up?: boolean;
}) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data
    .map((d, i) => {
      const x = i * stepX;
      const y = height - ((d - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const rising = up ?? data[data.length - 1] >= data[0];
  const color = rising ? "#16c784" : "#ea3943";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
