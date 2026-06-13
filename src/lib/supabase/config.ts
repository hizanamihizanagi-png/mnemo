// Central place to read Supabase config and know whether it's enabled.
// When env vars are missing, the app runs in "demo mode": the 3D
// landing, mock markets, and AI insights work, but auth/persistence
// are disabled with a friendly notice.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Public site origin, used to build auth redirect URLs. Falls back to
// localhost for local development.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
