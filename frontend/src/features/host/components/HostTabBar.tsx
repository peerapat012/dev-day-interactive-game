"use client";

export type HostTabId = "room" | "inputs" | "summary";

export const HOST_TABS: { id: HostTabId; label: string }[] = [
  { id: "room", label: "Room" },
  { id: "inputs", label: "Inputs" },
  { id: "summary", label: "Summary" },
];

interface HostTabBarProps {
  activeTab: HostTabId;
  onTabChange: (tab: HostTabId) => void;
  /** When false, Summary cannot be opened (no saved summary and no guest inputs). */
  summaryEnabled?: boolean;
}

export function HostTabBar({
  activeTab,
  onTabChange,
  summaryEnabled = true,
}: HostTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Host navigation"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-1 pt-2 sm:px-2">
        {HOST_TABS.map((tab) => {
          const active = activeTab === tab.id;
          const disabled = tab.id === "summary" && !summaryEnabled;
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  if (!disabled) onTabChange(tab.id);
                }}
                disabled={disabled}
                aria-disabled={disabled}
                title={
                  disabled
                    ? "Summary unlocks after guest submissions or when a saved summary exists"
                    : undefined
                }
                className={`flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition ${
                  disabled
                    ? "cursor-not-allowed text-zinc-600"
                    : active
                      ? "bg-violet-500/15 text-violet-300 active:scale-95"
                      : "text-zinc-400 active:scale-95 active:bg-white/5"
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
