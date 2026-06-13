import Link from "next/link";

// Two-panel auth layout: a branded marketing aside (hidden on mobile)
// beside the form. Shared by the login and signup pages.
const POINTS = [
  "Share market insights with a finance-only community",
  "Get AI-generated predictions on any ticker",
  "Paper-trade your conviction with $100k virtual cash",
  "Climb the leaderboard on real (simulated) returns",
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-bg-soft p-10 lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-bull/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-bg shadow-glow">
            M
          </span>
          <span className="text-xl font-black tracking-tight">mnemo</span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-black leading-tight tracking-tight">
            Markets,
            <br />
            decoded together.
          </h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted">
          Mnemo is for education and simulation. Nothing here is financial advice.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6">{children}</main>
    </div>
  );
}
