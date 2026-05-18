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

export function buildGroupStats(entries: Entry[]): GroupStat[] {
  const map = new Map<string, GroupStat>();

  for (const entry of entries) {
    const existing = map.get(entry.group);
    if (existing) {
      existing.count += 1;
      existing.inputs.push(entry.input);
    } else {
      map.set(entry.group, {
        group: entry.group,
        count: 1,
        inputs: [entry.input],
      });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function buildGroupBubbles(stats: GroupStat[]): BubbleItem[] {
  return stats.map((stat) => ({
    id: `group-${stat.group}`,
    label: stat.group,
    count: stat.count,
    hue: hashString(stat.group) % 360,
  }));
}

export function getTopGroups(stats: GroupStat[], limit: number): GroupStat[] {
  return stats.slice(0, limit);
}
