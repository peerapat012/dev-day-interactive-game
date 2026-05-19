import type { BubbleItem, Entry, GroupStat } from "@/types/entry";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildRawBubbles(entries: Entry[]): BubbleItem[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const key = entry.input.trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].map(([label, count]) => ({
    id: `raw-${label}`,
    label,
    count,
    hue: hashString(label) % 360,
  }));
}

export function isValidGroupName(group: string | null | undefined): boolean {
  return Boolean(group?.trim());
}

export function isClassifiedEntry(entry: Entry): boolean {
  return isValidGroupName(entry.group);
}

export function buildGroupStats(entries: Entry[]): GroupStat[] {
  const map = new Map<string, GroupStat>();

  for (const entry of entries) {
    if (!isClassifiedEntry(entry)) continue;

    const group = entry.group.trim();

    const existing = map.get(group);
    if (existing) {
      existing.count += 1;
      existing.inputs.push(entry.input);
    } else {
      map.set(group, {
        group,
        count: 1,
        inputs: [entry.input],
      });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function getTopGroups(stats: GroupStat[], limit: number): GroupStat[] {
  return stats
    .filter((stat) => isValidGroupName(stat.group) && stat.count > 0)
    .slice(0, limit);
}
