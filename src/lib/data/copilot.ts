import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Copilot persistence reads.
//
// Owner-only copilot_messages live behind RLS. In demo mode (no
// Supabase) or when signed out there is no stored history, so we
// return an empty array — the dock seeds its own greeting client-side.
// Nothing here ever throws.
// ─────────────────────────────────────────────────────────────

export async function getThreadMessages(userId: string): Promise<ChatMessage[]> {
  if (!userId) return [];
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("copilot_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200);
    return (data as ChatMessage[] | null) ?? [];
  } catch {
    return [];
  }
}
