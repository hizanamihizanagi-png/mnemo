import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Server-side Supabase client bound to the request cookies.
// Use inside Server Components, Route Handlers, and Server Actions.
// Returns null if Supabase is not configured (demo mode).
export async function getServerSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component without a writable cookie
          // store — safe to ignore; middleware refreshes the session.
        }
      },
    },
  });
}

// Admin client using the service-role key. Server-only. Bypasses RLS;
// use sparingly (e.g. aggregate leaderboard reads). Returns null if not set.
export async function getAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceKey) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Convenience: get the currently authenticated user (or null).
export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Resolve the authenticated user joined with their profile, shaped for
// the client SessionProvider. Returns null in demo mode or when signed out.
export async function getSessionUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? null,
    handle: profile?.handle ?? "trader",
    displayName: profile?.display_name ?? "Trader",
  };
}
