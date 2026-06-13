"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// Browser-side Supabase client (singleton). Safe to import in client
// components. Returns null if Supabase is not configured.
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}
