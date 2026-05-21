import type {
  BubbleItem,
  Entry,
  GroupContributor,
  GroupStat,
} from "@/types/entry";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildGroupBubbles(groups: GroupStat[]): BubbleItem[] {
  return groups.map((group) => ({
    id: `group-${group.group}`,
    label: group.group,
    count: group.count,
    hue: hashString(group.group) % 360,
  }));
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

const PENDING_GROUP_ALIASES = new Set(["", "pending", "unclassified"]);

export function isValidGroupName(group: string | null | undefined): boolean {
  const normalized = group?.trim().toLowerCase() ?? "";
  return Boolean(normalized) && !PENDING_GROUP_ALIASES.has(normalized);
}

export function isClassifiedEntry(entry: Entry): boolean {
  return isValidGroupName(entry.group);
}

function contributorFromEntry(entry: Entry): GroupContributor {
  const name = entry.name?.trim() || "Guest";
  return { name, input: entry.input.trim() || "…" };
}

/** Names + phrases for a group (falls back to inputs-only for older saved rounds). */
export function getGroupContributors(group: GroupStat): GroupContributor[] {
  if (group.contributors?.length) {
    return group.contributors;
  }
  return group.inputs.map((input) => ({
    name: "Guest",
    input: input.trim() || "…",
  }));
}

export function buildGroupStats(entries: Entry[]): GroupStat[] {
  const map = new Map<string, GroupStat>();

  for (const entry of entries) {
    if (!isClassifiedEntry(entry)) continue;

    const group = entry.group.trim();
    const contributor = contributorFromEntry(entry);

    const existing = map.get(group);
    if (existing) {
      existing.count += 1;
      existing.inputs.push(entry.input);
      existing.contributors = existing.contributors ?? [];
      existing.contributors.push(contributor);
    } else {
      map.set(group, {
        group,
        count: 1,
        inputs: [entry.input],
        contributors: [contributor],
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
