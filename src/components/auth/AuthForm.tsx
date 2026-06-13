"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/supabase/config";

// Email/password auth for sign in and sign up. On signup, the handle and
// display name are passed as user metadata so the database trigger
// (handle_new_user) provisions the profile + paper portfolio automatically.
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/home";
  const supabase = getBrowserSupabase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  if (!supabase) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-bold text-slate-100">Accounts are off in demo mode</h2>
        <p className="mt-2 text-sm text-muted">
          Add <code className="text-brand">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-brand">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment to
          enable sign in, posting, and paper trading. The feed, markets, and AI insights still work
          without keys.
        </p>
        <Link href="/home" className="btn-primary mt-4 inline-flex">
          Explore in demo mode →
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const sb = supabase!;

    try {
      if (isSignup) {
        const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (cleanHandle.length < 3) {
          setError("Handle must be at least 3 characters (letters, numbers, _).");
          setLoading(false);
          return;
        }
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
            data: {
              handle: cleanHandle,
              display_name: displayName.trim() || cleanHandle,
            },
          },
        });
        if (error) throw error;
        // When email confirmation is required, there's no session yet.
        if (!data.session) {
          setNotice("Check your inbox to confirm your email, then sign in.");
          setLoading(false);
          return;
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-100">
          {isSignup ? "Join Mnemo" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isSignup
            ? "Markets, decoded together. Start with $100k in paper cash."
            : "Sign in to post insights and trade your conviction."}
        </p>
      </div>

      {isSignup && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Handle</label>
            <div className="flex items-center rounded-xl border border-line bg-bg-soft pl-3 focus-within:border-brand">
              <span className="text-sm text-muted">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="quantqueen"
                className="w-full bg-transparent px-1 py-2 text-sm text-slate-100 outline-none placeholder:text-muted"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Quant Queen"
              className="input"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input"
          required
          minLength={6}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-bear/10 px-3 py-2 text-sm text-bear">{error}</p>
      )}
      {notice && (
        <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">{notice}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted">
        {isSignup ? (
          <>
            Already trading?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Mnemo?{" "}
            <Link href="/signup" className="font-semibold text-brand hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
