"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export interface SessionUser {
  id: string;
  email: string | null;
  handle: string;
  displayName: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  configured: false,
  signOut: async () => {},
  refresh: async () => {},
});

export function SessionProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const supabase = getBrowserSupabase();
  const configured = Boolean(supabase);

  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle, display_name")
      .eq("id", authUser.id)
      .maybeSingle();
    setUser({
      id: authUser.id,
      email: authUser.email ?? null,
      handle: profile?.handle ?? "trader",
      displayName: profile?.display_name ?? "Trader",
    });
    setLoading(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
      } else {
        refresh();
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, configured, signOut, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
