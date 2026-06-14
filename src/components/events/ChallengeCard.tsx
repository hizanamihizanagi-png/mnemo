"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import type { Challenge } from "@/lib/challenges";
import { cn, fmtCompact } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ChallengeCard — one forecast challenge.
//
// Renders the question, region/category, the crowd consensus (an
// informational bar, NOT betting odds), participation, the close
// date, and a Yes/No conviction control. Taking a side records a
// stance that will feed the user's track record when it resolves.
// No money, no payout — this serves the Proof pillar.
// ─────────────────────────────────────────────────────────────

function closeLabel(iso: string): string {
  const date = new Date(iso);
  const days = Math.max(0, Math.round((date.getTime() - Date.now()) / 86_400_000));
  const when = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${when} · ${days}d left`;
}

export default function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const router = useRouter();
  const { user, configured } = useSession();
  const [stance, setStance] = useState<"yes" | "no" | null>(null);
  const yesPct = Math.round(challenge.consensus * 100);

  function take(side: "yes" | "no") {
    if (!configured || !user) {
      router.push("/login?next=/events");
      return;
    }
    // Optimistic local stance; persistence lands with event_positions.
    setStance((cur) => (cur === side ? null : side));
  }

  return (
    <article className="card flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{challenge.category}</span>
        <span className="chip">{challenge.region}</span>
      </div>

      <h3 className="text-base font-bold leading-snug text-slate-100">
        {challenge.question}
      </h3>

      {/* Crowd consensus — informational, not odds */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>Community lean</span>
          <span className="font-mono text-slate-300">{yesPct}% Yes</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
          <div className="h-full rounded-full bg-brand" style={{ width: `${yesPct}%` }} />
        </div>
      </div>

      {/* Conviction control */}
      <div className="flex gap-2">
        {(["yes", "no"] as const).map((side) => {
          const active = stance === side;
          return (
            <button
              key={side}
              type="button"
              aria-pressed={active}
              onClick={() => take(side)}
              className={cn(
                "btn flex-1 border capitalize",
                active
                  ? side === "yes"
                    ? "border-bull/50 bg-bull/15 text-bull"
                    : "border-bear/50 bg-bear/15 text-bear"
                  : "border-line text-slate-200 hover:bg-bg-elevated",
              )}
            >
              {side}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          <span className="font-mono text-slate-300">{fmtCompact(challenge.participants)}</span>{" "}
          forecasting
        </span>
        <span>Closes {closeLabel(challenge.closeAt)}</span>
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        {stance
          ? "Stance noted. Correct calls will count toward your verified track record when this resolves."
          : "Take a side to test your conviction — no money involved."}
      </p>
    </article>
  );
}
