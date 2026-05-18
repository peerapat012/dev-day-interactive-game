"use client";

import { MobileTabBar } from "@/shared/components/layout/MobileTabBar";

interface AppShellProps {
  children: React.ReactNode;
  /** When false, hides bottom tabs and mobile bottom padding (e.g. cloud input page). */
  showTabBar?: boolean;
}

/** Mobile game shell: optional bottom tabs + safe-area padding. */
export function AppShell({ children, showTabBar = true }: AppShellProps) {
  return (
    <>
      <div
        className={
          showTabBar
            ? "flex min-h-dvh flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0"
            : "flex min-h-dvh flex-1 flex-col pb-[env(safe-area-inset-bottom,0px)]"
        }
      >
        {children}
      </div>
      {showTabBar ? <MobileTabBar /> : null}
    </>
  );
}
