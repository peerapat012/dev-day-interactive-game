"use client";

import { useCallback, useMemo, useState } from "react";
import { getTopGroups, buildGroupStats } from "@/lib/aggregateEntries";
import { TOP_GROUPS_COUNT } from "@/lib/constants";
import { joinGroupInputs } from "@/lib/joinGroupInputs";
import { summarizeTopGroups } from "@/services/ai/summarize";
import { useEntriesStore } from "@/store/entriesStore";
import type { SummarizeResultItem } from "@/types/api";

export function useTopGroupsSummary() {
  const entries = useEntriesStore((s) => s.entries);
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const [summaries, setSummaries] = useState<SummarizeResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSummarized, setHasSummarized] = useState(false);

  const topGroups = useMemo(
    () => getTopGroups(buildGroupStats(entries), TOP_GROUPS_COUNT),
    [entries],
  );

  const runSummarize = useCallback(async () => {
    if (topGroups.length === 0 || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { summaries: results } = await summarizeTopGroups({
        groups: topGroups.map((g) => ({
          group: g.group,
          inputs: joinGroupInputs(g.inputs),
        })),
      });
      setSummaries(results);
      setHasSummarized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summary failed");
    } finally {
      setLoading(false);
    }
  }, [topGroups, loading]);

  return {
    topGroups,
    summaries,
    loading,
    error,
    isHydrated,
    hasSummarized,
    runSummarize,
  };
}
