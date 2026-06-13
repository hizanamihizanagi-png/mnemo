"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import SentimentBadge from "@/components/ui/SentimentBadge";
import { useSession } from "@/components/auth/SessionProvider";
import type { Post } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// PostCard — the canonical rendering of a Mnemo "insight".
//
// Shared primitive: used by the home feed, profile/explore lists, and
// the related-posts rail on a stock page. Like / repost are optimistic
// and POST to /api/posts/[id]/{like,repost}; unauthenticated taps route
// to /login. Cashtags are linkified to the market page for that symbol.
// ─────────────────────────────────────────────────────────────

// Linkify $CASHTAGS inside a post body.
function renderBody(body: string) {
  const parts = body.split(/(\$[A-Za-z]{1,6}\b)/g);
  return parts.map((part, i) => {
    if (/^\$[A-Za-z]{1,6}$/.test(part)) {
      const sym = part.slice(1).toUpperCase();
      return (
        <Link
          key={i}
          href={`/markets/${sym}`}
          className="font-semibold text-brand hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          ${sym}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const { user, configured } = useSession();

  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [reposted, setReposted] = useState(post.reposted_by_me);
  const [repostCount, setRepostCount] = useState(post.repost_count);
  const [busy, setBusy] = useState(false);

  async function toggle(kind: "like" | "repost") {
    if (!configured || !user) {
      router.push("/login?next=/home");
      return;
    }
    if (busy) return;
    setBusy(true);

    // Optimistic update.
    if (kind === "like") {
      const next = !liked;
      setLiked(next);
      setLikeCount((c) => c + (next ? 1 : -1));
    } else {
      const next = !reposted;
      setReposted(next);
      setRepostCount((c) => c + (next ? 1 : -1));
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/${kind}`, { method: "POST" });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      if (kind === "like") {
        setLiked(data.liked);
        setLikeCount(data.like_count);
      } else {
        setReposted(data.reposted);
        setRepostCount(data.repost_count);
      }
    } catch {
      // Roll back on failure.
      if (kind === "like") {
        setLiked(post.liked_by_me);
        setLikeCount(post.like_count);
      } else {
        setReposted(post.reposted_by_me);
        setRepostCount(post.repost_count);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex gap-3 border-b border-line px-4 py-3.5 transition hover:bg-bg-soft/40">
      <Avatar handle={post.author.handle} src={post.author.avatar_url} size={44} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-bold text-slate-100">{post.author.display_name}</span>
          <span className="text-muted">@{post.author.handle}</span>
          <span className="text-muted">· {timeAgo(post.created_at)}</span>
          <SentimentBadge sentiment={post.sentiment} className="ml-auto" />
        </div>

        <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-200">
          {renderBody(post.body)}
        </p>

        <div className="mt-2.5 flex items-center gap-6 text-muted">
          <Link
            href={`/compose?reply=${post.id}`}
            className="flex items-center gap-1.5 text-sm transition hover:text-brand"
          >
            <ReplyIcon /> {post.reply_count > 0 && <span>{post.reply_count}</span>}
          </Link>

          <button
            onClick={() => toggle("repost")}
            disabled={busy}
            className={cn(
              "flex items-center gap-1.5 text-sm transition hover:text-bull",
              reposted && "text-bull",
            )}
          >
            <RepostIcon /> {repostCount > 0 && <span>{repostCount}</span>}
          </button>

          <button
            onClick={() => toggle("like")}
            disabled={busy}
            className={cn(
              "flex items-center gap-1.5 text-sm transition hover:text-bear",
              liked && "text-bear",
            )}
          >
            <HeartIcon filled={liked} /> {likeCount > 0 && <span>{likeCount}</span>}
          </button>
        </div>
      </div>
    </article>
  );
}

function ReplyIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
    </svg>
  );
}
function RepostIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}
