import { clsx, type ClassValue } from "clsx";
import type { Region } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Deterministic string hash (FNV-1a 32-bit). Used to seed the mock market.
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Seeded PRNG (mulberry32). Returns a function producing [0,1).
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function fmtCurrency(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// Format a money amount in an arbitrary ISO currency. Zero fraction
// digits for the high-magnitude currencies (XOF/XAF/NGN), two for the
// rest. Falls back to a plain localized number if the currency code is
// unknown to Intl, so this never throws.
const ZERO_FRACTION_CURRENCIES = new Set(["XOF", "XAF", "NGN"]);

export function fmtMoney(n: number, currency?: string): string {
  const cur = (currency ?? "USD").toUpperCase();
  const fractionDigits = ZERO_FRACTION_CURRENCIES.has(cur) ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(n);
  } catch {
    // Unknown currency code — fall back to a plain number.
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(n);
  }
}

// Best-effort default region from the browser's IANA timezone.
// Client-safe: never throws, defaults to "US".
export function defaultRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    switch (tz) {
      case "Africa/Abidjan":
      case "Africa/Dakar":
      case "Africa/Bamako":
      case "Africa/Lome":
      case "Africa/Ouagadougou":
        return "WAEMU";
      case "Africa/Johannesburg":
        return "ZA";
      case "Africa/Lagos":
        return "NG";
      case "Africa/Cairo":
        return "EG";
      case "Africa/Douala":
      case "Africa/Libreville":
      case "Africa/Brazzaville":
        return "CEMAC";
      default:
        return "US";
    }
  } catch {
    return "US";
  }
}

export function fmtNumber(n: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function fmtPct(n: number, withSign = true): string {
  const sign = withSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Extract $CASHTAGS from a post body. Returns uppercased unique symbols.
export function extractCashtags(text: string): string[] {
  const matches = text.match(/\$[A-Za-z]{1,6}\b/g) ?? [];
  const set = new Set(matches.map((m) => m.slice(1).toUpperCase()));
  return Array.from(set);
}
