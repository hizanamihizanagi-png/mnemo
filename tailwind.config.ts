import type { Config } from "tailwindcss";

// ─────────────────────────────────────────────────────────────
// Mnemo design system — "Warm Editorial × Terminal Precision".
//
// Token NAMES are preserved from the original cyan theme so every
// existing `text-brand` / `bg-bg-card` / `.card` re-skins in place
// with no per-file churn. Only the VALUES change:
//   • near-black warm base, ivory text, warm-graphite borders
//   • `brand` is now a restrained clay/amber accent (interactive only)
//   • `shadow.glow` is redefined as a quiet elevation (no neon)
//   • slate text steps are warmed so existing text-slate-* harmonizes
// P&L green/red stay as the only data-signal colors.
// ─────────────────────────────────────────────────────────────

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B0B0D", // page — near-black, faintly warm
          soft: "#121113", // subtle raise: inputs, hover fills
          card: "#151416", // surfaces
          elevated: "#1F1D20", // popovers, active rows
        },
        line: "#2A2724", // warm graphite border
        brand: {
          DEFAULT: "#C8743C", // clay accent — interactive/brand ONLY
          deep: "#A85E2E", // pressed / deeper
          glow: "#DDA06A", // hover / lighter clay
        },
        bull: "#4FB477",
        bear: "#D2603A",
        muted: "#A39E95", // warm gray, secondary text
        // Warm the slate text ramp so existing `text-slate-*` reads
        // ivory-on-near-black instead of cool blue-gray.
        slate: {
          50: "#FBFAF7",
          100: "#F2EFE9", // primary text
          200: "#E6E1D8",
          300: "#C9C3B8", // secondary text
          400: "#A39E95", // = muted
          500: "#8A857C",
          600: "#6B675F",
          700: "#4A463F",
          800: "#2E2A25",
          900: "#1A1715",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Calistoga", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        // Redefined: a quiet, color-free elevation. Every legacy
        // `shadow-glow` reference now softens to tasteful depth.
        glow: "0 1px 2px rgba(0,0,0,0.5), 0 12px 32px -16px rgba(0,0,0,0.65)",
        card: "0 1px 2px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        ticker: "ticker 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
