import { TOP_GROUPS_COUNT } from "@/lib/constants";
import { joinGroupInputs } from "@/lib/joinGroupInputs";
import { assertThaiSummaryContract } from "@/lib/validateThaiSummary";
import type {
  ClassifyBatchItem,
  HostSummaryGenerateResponse,
  SummarizeGroupPayload,
  SummarizeResultItem,
} from "@/types/api";
import type { GroupStat } from "@/types/entry";

interface HostSummaryDependencies {
  classify: (
    items: ClassifyBatchItem[],
  ) => Promise<Array<{ id: string; group: string }>>;
  summarize: (
    groups: SummarizeGroupPayload[],
  ) => Promise<SummarizeResultItem[]>;
}

export async function orchestrateHostSummary(
  items: ClassifyBatchItem[],
  dependencies: HostSummaryDependencies,
): Promise<HostSummaryGenerateResponse> {
  const classified = await dependencies.classify(items);
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
  items.forEach((item) => {
    const group = groupById.get(item.id)!;
    const inputs = inputsByGroup.get(group) ?? [];
    inputs.push(item.input);
    inputsByGroup.set(group, inputs);
  });

  const groups: GroupStat[] = [...inputsByGroup.entries()]
    .map(([group, inputs]) => ({
      group,
      count: inputs.length,
      inputs,
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
