import { hashString } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Deterministic gradient avatar from a handle (no image needed).
const PALETTES = [
  ["#38bdf8", "#0ea5e9"],
  ["#16c784", "#0c7a4f"],
  ["#a855f7", "#6d28d9"],
  ["#f59e0b", "#b45309"],
  ["#ec4899", "#9d174d"],
  ["#14b8a6", "#0f766e"],
];

export default function Avatar({
  handle,
  src,
  size = 40,
  className,
}: {
  handle: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const idx = hashString(handle) % PALETTES.length;
  const [from, to] = PALETTES[idx];
  const initials = handle.slice(0, 2).toUpperCase();

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={handle}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-bg",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initials}
    </div>
  );
}
