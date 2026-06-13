"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { useSession } from "@/components/auth/SessionProvider";
import type { Post, Sentiment } from "@/lib/types";
import { cn, extractCashtags } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Composer — the post authoring surface.
//
// Used both as a compact box at the top of the home feed and as the
// full-page composer (with an optional parent post when replying). It
// POSTs to /api/posts, surfaces moderation rejections inline (amber
// notice), bounces unauthenticated users to /login, and refreshes the
// server-rendered feed on success so the new post appears immediately.
// ─────────────────────────────────────────────────────────────

const MAX = 600;

const SENTIMENTS: { value: Sentiment; label: string; cls: string }[] = [
  { value: "bullish", label: "▲ Bullish", cls: "border-bull/40 bg-bull/10 text-bull" },
  { value: "bearish", label: "▼ Bearish", cls: "border-bear/40 bg-bear/10 text-bear" },
  { value: "neutral", label: "◆ Neutral", cls: "border-brand/40 bg-brand/10 text-brand" },
];

interface ApiResponse {
  ok: boolean;
  error?: string;
}

export default function Composer({
  replyTo = null,
  compact = false,
}: {
  replyTo?: Post | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const { user, configured } = useSession();

  const [body, setBody] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const cashtags = useMemo(() => extractCashtags(body), [body]);
  const remaining = MAX - body.length;
  const over = remaining < 0;
  const canPost = body.trim().length > 0 && !over && !submitting;

  // Signed-out / unconfigured: show a tasteful prompt instead of the form.
  if (!configured || !user) {
    return (
      <div className="card flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-sm text-muted">
          Sign in to share your market thesis with the community.
        </p>
        <Link href="/login?next=/home" className="btn-primary">
          Sign in to post
        </Link>
      </div>
    );
  }

  async function submit() {
    if (!canPost) return;
    setSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          sentiment,
          reply_to: replyTo?.id ?? null,
        }),
      });

      if (res.status === 401) {
        router.push("/login?next=/home");
        return;
      }

      const data = (await res.json()) as ApiResponse;

      if (!data.ok) {
        // Moderation rejection or DB error — show the reason inline.
        setNotice(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Success — clear and refresh the server-rendered feed.
      setBody("");
      setSentiment("neutral");
      router.refresh();
    } catch {
      setNotice("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn("flex gap-3", compact ? "px-4 py-3.5" : "p-4")}>
      <Avatar handle={user.handle} size={compact ? 40 : 44} />

      <div className="min-w-0 flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            replyTo
              ? `Reply to @${replyTo.author.handle}…`
              : "Share an insight. Tag tickers with $SYMBOL."
          }
          rows={compact ? 2 : 4}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-100 outline-none placeholder:text-muted"
        />

        {/* Detected cashtags preview */}
        {cashtags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {cashtags.map((sym) => (
              <span key={sym} className="chip border-brand/40 bg-brand/10 text-brand">
                ${sym}
              </span>
            ))}
          </div>
        )}

        {/* Moderation / error notice */}
        {notice && (
          <div className="mt-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {notice}
          </div>
        )}

        {/* Sentiment selector */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SENTIMENTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSentiment(s.value)}
              className={cn(
                "chip transition",
                sentiment === s.value
                  ? s.cls
                  : "border-line text-muted hover:text-slate-200",
              )}
            >
              {s.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <span
              className={cn(
                "font-mono text-xs",
                over ? "text-bear" : remaining <= 60 ? "text-amber-400" : "text-muted",
              )}
            >
              {remaining}
            </span>
            <button onClick={submit} disabled={!canPost} className="btn-primary">
              {submitting ? "Posting…" : replyTo ? "Reply" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
