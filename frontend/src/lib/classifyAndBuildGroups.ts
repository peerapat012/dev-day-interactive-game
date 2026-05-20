import { buildGroupStats } from "@/lib/aggregateEntries";
import { classifyPendingEntries } from "@/lib/classifyPendingEntries";
import { useEntriesStore } from "@/store/entriesStore";
import type { Entry, GroupStat } from "@/types/entry";

/** Classify pending rows, sync store, return all classified groups by count. */
export async function classifyAndBuildGroups(
  entries: Entry[],
  upsertEntry: (entry: Entry) => void,
): Promise<GroupStat[]> {
  const classified = await classifyPendingEntries(entries);
  for (const entry of classified) {
    upsertEntry(entry);
  }
  return buildGroupStats(useEntriesStore.getState().entries);
}
