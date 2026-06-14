import { cn } from "@/lib/utils";

// A restrained monospace exchange/region badge — the terminal-style
// replacement for emoji flags. Used in region pickers and headers.
export default function RegionCode({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "rounded border border-line bg-bg-soft px-1 py-0.5 font-mono text-[10px] font-semibold leading-none tracking-wide text-muted",
        className,
      )}
    >
      {code}
    </span>
  );
}
