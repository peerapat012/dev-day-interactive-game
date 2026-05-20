import type { Entry, GroupStat } from "@/types/entry";
import type { FloatingTextItem } from "@/types/floatingText";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** One floating pill per guest phrase (label = raw input only). */
export function buildFloatingItemsFromEntries(entries: Entry[]): FloatingTextItem[] {
  return entries.map((entry) => ({
    id: entry.$id,
    label: entry.input.trim() || "…",
    variant: "input" as const,
    hue: hashString(entry.$id) % 360,
  }));
}

/** One floating pill per semantic group. */
export function buildFloatingItemsFromGroups(groups: GroupStat[]): FloatingTextItem[] {
  return groups.map((group) => ({
    id: `group-${group.group}`,
    label: group.group,
    variant: "group" as const,
    meta: `${group.count} phrase${group.count === 1 ? "" : "s"}`,
    count: group.count,
    hue: hashString(group.group) % 360,
  }));
}
