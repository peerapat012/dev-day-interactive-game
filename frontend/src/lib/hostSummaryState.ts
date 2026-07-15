import { getTopGroups } from "@/lib/aggregateEntries";
import { TOP_GROUPS_COUNT } from "@/lib/constants";
import type { SummarizeResultItem } from "@/types/api";
import type { GroupStat } from "@/types/entry";
import type { RoomSnapshot } from "@/types/room";

export type HostSummaryStatus =
  | "loading_saved"
  | "generating"
  | "empty"
  | "error"
  | "ready";

export type HostSummaryInitialAction = "show_saved" | "auto_generate" | "show_empty";

export function getDisplaySummaries(
  groups: GroupStat[],
  summaries: SummarizeResultItem[],
): SummarizeResultItem[] {
  return getTopGroups(groups, TOP_GROUPS_COUNT)
    .map((group) => summaries.find((item) => item.group === group.group))
    .filter((item): item is SummarizeResultItem => Boolean(item));
}

export function getSummaryTopicLabel(item: SummarizeResultItem): string {
  return item.topic?.trim() || "Summary";
}

/** Derive isSummary when the Appwrite boolean column is absent. */
export function deriveIsSummaryFromSummarizeJson(summarizeJson: string): boolean {
  try {
    const parsed = JSON.parse(summarizeJson || "[]") as unknown;
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

/** Summary tab is enabled when a saved summary exists or guest inputs are present. */
export function isSummaryTabEnabled(
  isSummary: boolean,
  entryCount: number,
): boolean {
  return isSummary || entryCount > 0;
}

/** Prefer Room when Summary would open while disabled. */
export function resolveHostLandingTab(
  preferred: "room" | "inputs" | "summary",
  isSummary: boolean,
  entryCount: number,
): "room" | "inputs" | "summary" {
  if (preferred === "summary" && !isSummaryTabEnabled(isSummary, entryCount)) {
    return "room";
  }
  return preferred;
}

export function resolveInitialSummaryAction(
  snapshot: RoomSnapshot,
  entryCount: number,
): HostSummaryInitialAction {
  if (snapshot.summaries.length > 0) return "show_saved";
  if (entryCount > 0) return "auto_generate";
  return "show_empty";
}

/** Entries arrived after the first load resolved to an empty waiting state. */
export function shouldAutoGenerateAfterEmptyState(
  status: HostSummaryStatus,
  entryCount: number,
): boolean {
  return status === "empty" && entryCount > 0;
}
