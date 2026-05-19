"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildGroupStats,
  getTopGroups,
  isClassifiedEntry,
  isValidGroupName,
} from "@/lib/aggregateEntries";
import { classifyPendingEntries } from "@/lib/classifyPendingEntries";
import { TOP_GROUPS_COUNT } from "@/lib/constants";
import { joinGroupInputs } from "@/lib/joinGroupInputs";
import { summarizeTopGroups } from "@/services/ai/summarize";
import { useEntriesStore } from "@/store/entriesStore";
import type { SummarizeResultItem } from "@/types/api";
import type { GroupStat } from "@/types/entry";

export type SummaryPhase = "idle" | "classifying" | "summarizing";

function orderSummariesByGroups(
  groups: GroupStat[],
  results: SummarizeResultItem[],
): SummarizeResultItem[] {
  return groups
    .map((g) => results.find((item) => item.group === g.group))
    .filter((item): item is SummarizeResultItem => Boolean(item));
}

export function useTopGroupsSummary() {
  const entries = useEntriesStore((s) => s.entries);
  const upsertEntry = useEntriesStore((s) => s.upsertEntry);
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const [displayGroups, setDisplayGroups] = useState<GroupStat[]>([]);
  const [summaries, setSummaries] = useState<SummarizeResultItem[]>([]);
  const [phase, setPhase] = useState<SummaryPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasSummarized, setHasSummarized] = useState(false);

  const pendingCount = useMemo(
    () => entries.filter((e) => !isClassifiedEntry(e)).length,
    [entries],
  );

  const classifiedCount = useMemo(
    () => entries.filter((e) => isClassifiedEntry(e)).length,
    [entries],
  );

  const loading = phase !== "idle";

  const runSummarize = useCallback(async () => {
    if (entries.length === 0 || loading) return;

    setPhase("classifying");
    setError(null);

    try {
      const classified = await classifyPendingEntries(entries);
      for (const entry of classified) {
        upsertEntry(entry);
      }

      const freshEntries = useEntriesStore.getState().entries;
      const groups = getTopGroups(
        buildGroupStats(freshEntries),
        TOP_GROUPS_COUNT,
      );

      if (groups.length === 0) {
        throw new Error("No classified groups yet. Add submissions on Cloud first.");
      }

      setPhase("summarizing");

      const { summaries: results } = await summarizeTopGroups({
        groups: groups.map((g) => ({
          group: g.group,
          inputs: joinGroupInputs(g.inputs),
        })),
      });

      const validResults = results.filter((item) => isValidGroupName(item.group));
      const ordered = orderSummariesByGroups(groups, validResults);

      setDisplayGroups(groups);
      setSummaries(ordered);
      setHasSummarized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summary failed");
    } finally {
      setPhase("idle");
    }
  }, [entries, loading, upsertEntry]);

  return {
    /** Classified top groups — only populated after Summarize succeeds. */
    topGroups: hasSummarized ? displayGroups : [],
    summaries: hasSummarized ? summaries : [],
    loading,
    phase,
    error,
    isHydrated,
    hasSummarized,
    pendingCount,
    classifiedCount,
    entryCount: entries.length,
    runSummarize,
  };
}
