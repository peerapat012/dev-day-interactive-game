"use client";

import { useMemo } from "react";
import { buildGroupBubbles, buildGroupStats } from "@/lib/aggregateEntries";
import { useEntriesStore } from "@/store/entriesStore";

export function useGroupStats() {
  const entries = useEntriesStore((s) => s.entries);

  const stats = useMemo(() => buildGroupStats(entries), [entries]);
  const bubbles = useMemo(() => buildGroupBubbles(stats), [stats]);

  return { stats, bubbles };
}
