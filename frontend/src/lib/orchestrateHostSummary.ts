import { TOP_GROUPS_COUNT } from "@/lib/constants";
import { joinGroupInputs } from "@/lib/joinGroupInputs";
import { assertThaiSummaryContract } from "@/lib/validateThaiSummary";
import type {
  ClassifyBatchItem,
  HostSummaryGenerateItem,
  HostSummaryGenerateResponse,
  SummarizeGroupPayload,
  SummarizeResultItem,
} from "@/types/api";
import type { GroupContributor, GroupStat } from "@/types/entry";

interface HostSummaryDependencies {
  classify: (
    items: ClassifyBatchItem[],
  ) => Promise<Array<{ id: string; group: string }>>;
  summarize: (
    groups: SummarizeGroupPayload[],
  ) => Promise<SummarizeResultItem[]>;
}

function contributorFromItem(item: HostSummaryGenerateItem): GroupContributor {
  return {
    name: item.name?.trim() || "Guest",
    input: item.input.trim() || "…",
  };
}

export async function orchestrateHostSummary(
  items: HostSummaryGenerateItem[],
  dependencies: HostSummaryDependencies,
): Promise<HostSummaryGenerateResponse> {
  const classified = await dependencies.classify(
    items.map(({ id, input }) => ({ id, input })),
  );
  const groupById = new Map(
    classified.map((item) => [item.id, item.group.trim()]),
  );

  const entryGroups = items.map((item) => {
    const group = groupById.get(item.id);
    if (!group) {
      throw new Error(`Classification returned no group for item ${item.id}`);
    }
    return { id: item.id, group };
  });

  const inputsByGroup = new Map<string, string[]>();
  const contributorsByGroup = new Map<string, GroupContributor[]>();
  items.forEach((item) => {
    const group = groupById.get(item.id)!;
    const inputs = inputsByGroup.get(group) ?? [];
    inputs.push(item.input);
    inputsByGroup.set(group, inputs);

    const contributors = contributorsByGroup.get(group) ?? [];
    contributors.push(contributorFromItem(item));
    contributorsByGroup.set(group, contributors);
  });

  const groups: GroupStat[] = [...inputsByGroup.entries()]
    .map(([group, inputs]) => ({
      group,
      count: inputs.length,
      inputs,
      contributors: contributorsByGroup.get(group) ?? [],
    }))
    .sort((a, b) => b.count - a.count);
  const topGroups = groups.slice(0, TOP_GROUPS_COUNT);

  const generated = await dependencies.summarize(
    topGroups.map((group) => ({
      group: group.group,
      inputs: joinGroupInputs(group.inputs),
    })),
  );
  const summaryByGroup = new Map(
    generated.map((summary) => [summary.group, summary]),
  );
  const summaries = topGroups.map((group) => {
    const summary = summaryByGroup.get(group.group);
    if (!summary) {
      throw new Error(`Summary returned no result for group ${group.group}`);
    }
    return summary;
  });

  assertThaiSummaryContract(summaries);

  return { entryGroups, groups, summaries };
}
