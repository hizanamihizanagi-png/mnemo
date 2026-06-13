"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/SessionProvider";
import Avatar from "@/components/ui/Avatar";

const NAV = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/markets", label: "Markets", icon: MarketsIcon },
  { href: "/explore", label: "Explore", icon: ExploreIcon },
  { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon },
  { href: "/portfolio", label: "Portfolio", icon: WalletIcon },
  { href: "/terminal", label: "Terminal", icon: TerminalIcon },
  { href: "/strategies", label: "Strategies", icon: StrategiesIcon },
  { href: "/watchlist", label: "Watchlist", icon: WatchlistIcon },
  { href: "/news", label: "News", icon: NewsIcon },
  { href: "/reports", label: "Reports", icon: ReportsIcon },
  { href: "/events", label: "Events", icon: EventsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, configured, signOut } = useSession();

  return (
    <aside className="sticky top-0 flex h-screen w-[68px] flex-col items-center gap-1 border-r border-line px-2 py-4 sm:w-60 sm:items-stretch sm:px-3">
      <Link href="/" className="mb-4 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-bg shadow-glow">
          M
        </span>
        <span className="hidden text-xl font-black tracking-tight sm:block">
          mnemo
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition",
                active
                  ? "bg-bg-elevated text-brand"
                  : "text-slate-300 hover:bg-bg-soft hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden sm:block">{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/compose"
          className="mt-3 hidden items-center justify-center rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-bg shadow-glow transition hover:bg-brand-glow sm:flex"
        >
          Post insight
        </Link>
        <Link
          href="/compose"
          className="mt-3 flex items-center justify-center rounded-full bg-brand p-2.5 text-bg shadow-glow sm:hidden"
          aria-label="Post insight"
        >
          <PlusIcon className="h-5 w-5" />
        </Link>
      </nav>

      <div className="mt-auto">
        {user ? (
          <div className="flex items-center gap-2 rounded-xl px-1 py-2 sm:px-2">
            <Avatar handle={user.handle} size={36} />
            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="truncate text-sm font-semibold">{user.displayName}</p>
              <p className="truncate text-xs text-muted">@{user.handle}</p>
            </div>
            <button
              onClick={signOut}
              className="hidden text-xs text-muted hover:text-bear sm:block"
              title="Sign out"
            >
              Exit
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {configured ? (
              <>
                <Link href="/login" className="btn-ghost hidden sm:flex">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary hidden sm:flex">
                  Join Mnemo
                </Link>
              </>
            ) : (
              <p className="hidden px-2 text-xs leading-relaxed text-muted sm:block">
                Demo mode — add Supabase keys to enable accounts.
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Inline icons (no icon dependency) ──────────────────────────
type IconProps = { className?: string };
function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function MarketsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l5-5 4 4 8-9" /><path d="M21 7v5h-5" />
    </svg>
  );
}
function ExploreIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
    </svg>
  );
}
function TrophyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 4h10v4a5 5 0 0 1-10 0Z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 13v4" />
    </svg>
  );
}
function WalletIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12h3M3 9h18" />
    </svg>
  );
}
function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function TerminalIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" />
    </svg>
  );
}
function StrategiesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M6 8.5v3a3 3 0 0 0 3 3h.5M18 8.5v3a3 3 0 0 1-3 3h-.5" />
    </svg>
  );
}
function WatchlistIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function NewsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h13v14a1 1 0 0 0 1-1V8h2v10a3 3 0 0 1-3 3H6a2 2 0 0 1-2-2Z" /><path d="M7 9h7M7 13h7M7 17h4" />
    </svg>
  );
}
function ReportsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2h8l4 4v16H6Z" /><path d="M14 2v4h4M9 13l2 2 3-4" />
    </svg>
  );
}
function EventsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4M12 13v4M9 16h6" />
    </svg>
  );
}
