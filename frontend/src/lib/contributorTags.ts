import type { GroupContributor } from "@/types/entry";

export interface ContributorTag {
  name: string;
  /** Number of phrases this guest submitted in this group. */
  count: number;
  inputs: string[];
}

/** One tag per guest with all their phrases in this group. */
export function buildContributorTags(
  contributors: GroupContributor[],
): ContributorTag[] {
  const map = new Map<string, string[]>();

  for (const c of contributors) {
    const name = c.name.trim() || "Guest";
    const phrase = c.input.trim() || "…";
    const list = map.get(name) ?? [];
    list.push(phrase);
    map.set(name, list);
  }

  return [...map.entries()]
    .map(([name, inputs]) => ({
      name,
      count: inputs.length,
      inputs,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
