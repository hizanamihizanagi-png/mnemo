import { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TickerTape from "@/components/layout/TickerTape";
import RightRail from "@/components/layout/RightRail";

// The authenticated/app shell: persistent left sidebar, a sticky market
// ticker, the routed content column, and a contextual right rail.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1280px]">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col border-x border-line">
        <div className="sticky top-0 z-20 backdrop-blur">
          <Suspense fallback={<div className="h-[37px] border-b border-line bg-bg-soft/80" />}>
            <TickerTape />
          </Suspense>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <aside className="hidden w-80 shrink-0 lg:block">
        <Suspense fallback={null}>
          <RightRail />
        </Suspense>
      </aside>
    </div>
  );
}
