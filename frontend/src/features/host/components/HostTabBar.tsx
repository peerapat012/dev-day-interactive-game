"use client";

export type HostTabId = "room" | "inputs" | "groups" | "summary";

const TABS: { id: HostTabId; label: string }[] = [
  { id: "room", label: "Room" },
  { id: "inputs", label: "Inputs" },
  { id: "groups", label: "Groups" },
  { id: "summary", label: "Summary" },
];

interface HostTabBarProps {
  activeTab: HostTabId;
  onTabChange: (tab: HostTabId) => void;
}

export function HostTabBar({ activeTab, onTabChange }: HostTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Host navigation"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-1 pt-2 sm:px-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition active:scale-95 ${
                  active
                    ? "bg-violet-500/15 text-violet-300"
                    : "text-zinc-400 active:bg-white/5"
                }`}
              >
                <span className="text-[10px] font-medium leading-none sm:text-xs">
                  {tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
