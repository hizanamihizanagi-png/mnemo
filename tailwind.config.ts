import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#080b14",
          soft: "#0d1220",
          card: "#111827",
          elevated: "#161f33",
        },
        line: "#1e293b",
        brand: {
          DEFAULT: "#38bdf8",
          deep: "#0ea5e9",
          glow: "#7dd3fc",
        },
        bull: "#16c784",
        bear: "#ea3943",
        muted: "#7b8aa5",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(56, 189, 248, 0.45)",
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
