import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import SentimentBadge from "@/components/ui/SentimentBadge";
import Composer from "@/components/feed/Composer";
import { getPost } from "@/lib/data/feed";
import { timeAgo } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Compose — the full-page authoring view (auth-protected by
// middleware). When ?reply=<id> is present we load the parent post
// and show it as context above the composer so replies have a frame.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ reply?: string }>;
}) {
  const { reply } = await searchParams;
  const parent = reply ? await getPost(reply) : null;

  return (
    <div>
      {/* Page header */}
      <header className="sticky top-[37px] z-10 flex items-center gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur">
        <Link href="/home" className="link-muted text-sm">
          ←
        </Link>
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-100">
            {parent ? "Reply" : "Compose"}
          </h1>
          <p className="text-xs text-muted">
            {parent ? "Add to the conversation" : "Share a new insight"}
          </p>
        </div>
      </header>

      {/* Parent post context (when replying) */}
      {parent && (
        <article className="flex gap-3 border-b border-line px-4 py-3.5">
          <Avatar handle={parent.author.handle} src={parent.author.avatar_url} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-bold text-slate-100">{parent.author.display_name}</span>
              <span className="text-muted">@{parent.author.handle}</span>
              <span className="text-muted">· {timeAgo(parent.created_at)}</span>
              <SentimentBadge sentiment={parent.sentiment} className="ml-auto" />
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-200">
              {parent.body}
            </p>
          </div>
        </article>
      )}

      {/* Composer */}
      <Composer replyTo={parent} />
    </div>
  );
}
