import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Calistoga } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { getSessionUser } from "@/lib/supabase/server";

// ── Type system ────────────────────────────────────────────────
// Inter for precise UI, JetBrains Mono for tabular data, Calistoga
// as the warm editorial display serif (the "human warmth").
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});
const calistoga = Calistoga({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Mnemo — The Social Network for Markets",
  description:
    "Mnemo is the finance-only social network: share market insights, get AI-driven predictions, and paper-trade on your conviction. Markets, decoded together.",
  keywords: [
    "finance social network",
    "stock predictions",
    "AI market insights",
    "paper trading",
    "stocks",
    "investing",
  ],
  openGraph: {
    title: "Mnemo — The Social Network for Markets",
    description:
      "Share market insights, get AI-driven predictions, and paper-trade your conviction.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getSessionUser();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${calistoga.variable}`}
    >
      <body>
        <SessionProvider initialUser={initialUser}>{children}</SessionProvider>
      </body>
    </html>
  );
}
