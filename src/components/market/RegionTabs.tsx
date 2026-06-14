"use client";

import Link from "next/link";
import { REGIONS } from "@/lib/universe";
import RegionCode from "@/components/market/RegionCode";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// RegionTabs — scrollable zone selector for the markets page.
// "Global" plus each supported exchange region (BRVM, JSE, NGX…).
// Each tab is a link that sets ?region=ID; "Global" clears it.
// ─────────────────────────────────────────────────────────────

export default function RegionTabs({ current }: { current: string }) {
  const tabs = [
    { id: "global", label: "Global", code: "ALL", href: "/markets" },
    ...REGIONS.map((r) => ({ id: r.id, label: r.label, code: r.code, href: `/markets?region=${r.id}` })),
  ];

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const active = t.id === current;
        return (
          <Link
            key={t.id}
            href={t.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              active
                ? "border-brand/50 bg-brand/10 text-brand"
                : "border-line text-muted hover:bg-bg-soft hover:text-slate-200",
            )}
          >
            <RegionCode code={t.code} />
            <span className="whitespace-nowrap">{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
