import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { getSessionUser } from "@/lib/supabase/server";

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
    <html lang="en">
      <body>
        <SessionProvider initialUser={initialUser}>{children}</SessionProvider>
      </body>
    </html>
  );
}
