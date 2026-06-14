"use client";

import { useState, type ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/SessionProvider";
import Avatar from "@/components/ui/Avatar";

type NavItem = { href: string; label: string; icon: (p: IconProps) => ReactElement };
type NavGroup = { pillar: string | null; items: NavItem[] };

// The four pillars (plus the Feed) frame the IA. Every href is an
// existing route — this is a regrouping, not a migration.
const NAV_GROUPS: NavGroup[] = [
  { pillar: null, items: [{ href: "/home", label: "Feed", icon: HomeIcon }] },
  {
    pillar: "Research",
    items: [
      { href: "/markets", label: "Markets", icon: MarketsIcon },
      { href: "/explore", label: "Explore", icon: ExploreIcon },
      { href: "/news", label: "News", icon: NewsIcon },
      { href: "/reports", label: "Memos", icon: ReportsIcon },
      { href: "/watchlist", label: "Watchlist", icon: WatchlistIcon },
    ],
  },
  {
    pillar: "Proof",
    items: [{ href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon }],
  },
  {
    pillar: "Practice",
    items: [
      { href: "/portfolio", label: "Portfolio", icon: WalletIcon },
      { href: "/strategies", label: "Strategies", icon: StrategiesIcon },
      { href: "/events", label: "Challenges", icon: EventsIcon },
    ],
  },
  {
    pillar: "Terminal",
    items: [{ href: "/terminal", label: "Terminal", icon: TerminalIcon }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, configured, signOut } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  // "My record" (Proof) points at the signed-in user's public profile.
  const groups: NavGroup[] = NAV_GROUPS.map((g) =>
    g.pillar === "Proof" && user
      ? {
          ...g,
          items: [
            { href: `/user/${user.handle}`, label: "My record", icon: ProofIcon },
            ...g.items,
          ],
        }
      : g,
  );

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex sticky top-0 h-screen w-60 flex-col items-stretch gap-1 border-r border-line px-3 py-4">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-display text-lg leading-none text-bg">
            M
          </span>
          <span className="font-display text-2xl leading-none tracking-tight">
            mnemo
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={group.pillar ?? "feed"} className={cn(gi > 0 && "mt-3")}>
              {group.pillar && (
                <p className="eyebrow mb-1 px-3">{group.pillar}</p>
              )}
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium transition-colors",
                      active
                        ? "bg-bg-elevated text-slate-100"
                        : "text-slate-400 hover:bg-bg-soft hover:text-slate-100",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-[18px] w-[3px] shrink-0 rounded-full",
                        active ? "bg-brand" : "bg-transparent",
                      )}
                    />
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          <Link
            href="/compose"
            className="mt-4 flex items-center justify-center rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-brand-glow"
          >
            Post insight
          </Link>
        </nav>

        <div className="mt-auto">
          {user ? (
            <div className="flex items-center gap-2 rounded-xl px-2 py-2">
              <Avatar handle={user.handle} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.displayName}</p>
                <p className="truncate text-xs text-muted">@{user.handle}</p>
              </div>
              <button
                onClick={signOut}
                className="text-xs text-muted hover:text-bear"
                title="Sign out"
              >
                Exit
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {configured ? (
                <>
                  <Link href="/login" className="btn-ghost">
                    Sign in
                  </Link>
                  <Link href="/signup" className="btn-primary">
                    Join Mnemo
                  </Link>
                </>
              ) : (
                <p className="px-2 text-xs leading-relaxed text-muted">
                  Demo mode — add Supabase keys to enable accounts.
                </p>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 2. Mobile Bottom Tab Bar */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-card/95 border-t border-line z-40 justify-around items-center px-4 pb-safe backdrop-blur">
        {[
          { href: "/home", label: "Feed", icon: HomeIcon },
          { href: "/markets", label: "Markets", icon: MarketsIcon },
          { href: "/terminal", label: "Terminal", icon: TerminalIcon },
          { href: "/portfolio", label: "Portfolio", icon: WalletIcon },
        ].map((item) => {
          const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors",
                active ? "text-brand" : "text-slate-400 hover:text-slate-100",
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors",
            menuOpen ? "text-brand" : "text-slate-400 hover:text-slate-100",
          )}
        >
          <MenuIcon className="h-5 w-5 mb-0.5" />
          <span>More</span>
        </button>
      </div>

      {/* 3. Mobile Floating Action Button (FAB) for Post insight */}
      {pathname !== "/compose" && (
        <Link
          href="/compose"
          className="flex md:hidden fixed bottom-20 right-4 z-40 bg-brand text-bg p-3 rounded-full shadow-glow hover:bg-brand-glow transition-transform active:scale-95"
          aria-label="Post insight"
        >
          <PlusIcon className="h-6 w-6" />
        </Link>
      )}

      {/* 4. Mobile "More" Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg/98 backdrop-blur p-6 overflow-y-auto animate-fade-up">
          <header className="flex items-center justify-between border-b border-line pb-4 mb-4">
            <span className="font-display text-xl font-bold tracking-tight text-slate-100">
              Navigation Menu
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-md p-1.5 text-muted hover:bg-bg-soft hover:text-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-6">
            {groups.map((group) => (
              <div key={group.pillar ?? "general"} className="space-y-2">
                <h3 className="eyebrow px-2">{group.pillar ?? "General"}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors border border-transparent",
                          active
                            ? "bg-bg-elevated border-brand/20 text-slate-100"
                            : "bg-bg-soft hover:bg-bg-elevated text-slate-300 hover:text-slate-100",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5 text-brand" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-line pt-4">
            {user ? (
              <div className="flex items-center justify-between bg-bg-soft rounded-xl p-3 border border-line">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar handle={user.handle} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{user.displayName}</p>
                    <p className="truncate text-xs text-muted">@{user.handle}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="btn-ghost py-1 px-3 text-xs text-bear hover:bg-bear/10 hover:border-bear/30 transition-colors"
                >
                  Exit
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {configured ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="btn-ghost text-center py-2.5 text-sm"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="btn-primary text-center py-2.5 text-sm"
                    >
                      Join Mnemo
                    </Link>
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted py-2 bg-bg-soft rounded-xl border border-line">
                    Demo mode active.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
function ProofIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12.5l2 2 4-4.5" /><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z" />
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

function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

