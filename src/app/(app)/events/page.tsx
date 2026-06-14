import Link from "next/link";
import { getChallenges } from "@/lib/challenges";
import ChallengeCard from "@/components/events/ChallengeCard";

// ─────────────────────────────────────────────────────────────
// Challenges — time-boxed forecast questions across markets & macro.
//
// Take a side to test your conviction; correct calls feed your
// verified track record (the Proof pillar). Not a prediction market:
// no betting, no payout. Deterministic in demo mode (no env needed).
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const challenges = getChallenges();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header>
        <p className="eyebrow">Practice</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Challenges</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
          Time-boxed forecasts on markets and macro across every region. Take a
          side to test your conviction — when a challenge resolves, your correct
          calls count toward your{" "}
          <Link href="/leaderboard" className="text-brand hover:underline">
            verified track record
          </Link>
          . No money, no betting — just proof.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((c) => (
          <ChallengeCard key={c.id} challenge={c} />
        ))}
      </div>

      <p className="mt-6 px-1 text-xs leading-relaxed text-muted">
        Consensus and participation are simulated for education &amp; demonstration
        only — not financial advice.
      </p>
    </div>
  );
}
