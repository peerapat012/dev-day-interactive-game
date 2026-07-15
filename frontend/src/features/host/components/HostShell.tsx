"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { HostTabBar, type HostTabId } from "@/features/host/components/HostTabBar";

interface HostShellProps {
  activeTab: HostTabId;
  onTabChange: (tab: HostTabId) => void;
  title: string;
  description?: string;
  summaryEnabled?: boolean;
  children: ReactNode;
}

export function HostShell({
  activeTab,
  onTabChange,
  title,
  description,
  summaryEnabled = true,
  children,
}: HostShellProps) {
  return (
    <motion.div className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:gap-6 sm:px-6 sm:py-6">
        <header className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400 sm:text-xs">
            Host
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-xs text-zinc-400 sm:text-sm">{description}</p>
          ) : null}
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
      <HostTabBar
        activeTab={activeTab}
        onTabChange={onTabChange}
        summaryEnabled={summaryEnabled}
      />
    </motion.div>
  );
}
