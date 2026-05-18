"use client";

import { BubbleField } from "@/shared/components/bubble/BubbleField";
import { GroupDetailPanel } from "@/features/groups/components/GroupDetailPanel";
import { useGroupStats } from "@/features/groups/hooks/useGroupStats";
import { useEntriesStore } from "@/store/entriesStore";
import type { BubbleItem } from "@/types/entry";

export function GroupWordCloud() {
  const { bubbles } = useGroupStats();
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const setSelectedGroup = useEntriesStore((s) => s.setSelectedGroup);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-zinc-500">
        Loading groups…
      </div>
    );
  }

  if (!bubbles.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-white/10 text-sm text-zinc-500">
        No groups yet. Add inputs on the live cloud page.
      </div>
    );
  }

  function handleClick(item: BubbleItem) {
    setSelectedGroup(item.label);
  }

  return (
    <>
      <BubbleField
        items={bubbles}
        onBubbleClick={handleClick}
        className="min-h-[min(65vh,560px)]"
      />
      <GroupDetailPanel />
    </>
  );
}
