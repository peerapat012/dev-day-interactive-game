"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getTopGroups,
  isClassifiedEntry,
  isValidGroupName,
} from "@/lib/aggregateEntries";
import { classifyAndBuildGroups } from "@/lib/classifyAndBuildGroups";
import { TOP_GROUPS_COUNT } from "@/lib/constants";
import { joinGroupInputs } from "@/lib/joinGroupInputs";
import { saveRoomRound, startNewRound } from "@/services/appwrite/rooms";
import { summarizeTopGroups } from "@/services/ai/summarize";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";
import type { SummarizeResultItem } from "@/types/api";
import type { GroupStat } from "@/types/entry";

export type SummaryPhase = "idle" | "classifying" | "summarizing" | "saving";

function orderSummariesByGroups(
  groups: GroupStat[],
  results: SummarizeResultItem[],
): SummarizeResultItem[] {
  return groups
    .map((g) => results.find((item) => item.group === g.group))
    .filter((item): item is SummarizeResultItem => Boolean(item));
}

export function useHostRoomSummary() {
  const entries = useEntriesStore((s) => s.entries);
  const setEntries = useEntriesStore((s) => s.setEntries);
  const upsertEntry = useEntriesStore((s) => s.upsertEntry);
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const roomId = useRoomStore((s) => s.roomId);
  const roomRowId = useRoomStore((s) => s.roomRowId);

  const [allGroups, setAllGroups] = useState<GroupStat[]>([]);
  const [topGroups, setTopGroups] = useState<GroupStat[]>([]);
  const [summaries, setSummaries] = useState<SummarizeResultItem[]>([]);
  const [phase, setPhase] = useState<SummaryPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const roomEntries = useMemo(
    () => (roomId ? entries.filter((e) => e.roomId === roomId) : []),
    [entries, roomId],
  );

  const pendingCount = useMemo(
    () => roomEntries.filter((e) => !isClassifiedEntry(e)).length,
    [roomEntries],
  );

  const loading = phase !== "idle";

  const resetUi = useCallback(() => {
    setAllGroups([]);
    setTopGroups([]);
    setSummaries([]);
    setHasGenerated(false);
    setHasSaved(false);
    setError(null);
    setPhase("idle");
  }, []);

  const runSummarize = useCallback(async () => {
    if (roomEntries.length === 0 || loading || !roomRowId) return;

    setPhase("classifying");
    setError(null);
    setHasSaved(false);

    try {
      const classifiedGroups = await classifyAndBuildGroups(
        roomEntries,
        upsertEntry,
      );
      const groups = getTopGroups(classifiedGroups, TOP_GROUPS_COUNT);

      if (groups.length === 0) {
        throw new Error("No classified groups yet. Classify guest submissions first.");
      }

      setAllGroups(classifiedGroups);
      setPhase("summarizing");

      const { summaries: results } = await summarizeTopGroups({
        groups: groups.map((g) => ({
          group: g.group,
          inputs: joinGroupInputs(g.inputs),
        })),
      });

      const validResults = results.filter((item) => isValidGroupName(item.group));
      const ordered = orderSummariesByGroups(groups, validResults);

      setTopGroups(groups);
      setSummaries(ordered);
      setHasGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summary failed");
    } finally {
      setPhase("idle");
    }
  }, [roomEntries, loading, roomRowId, upsertEntry]);

  const saveSummary = useCallback(async () => {
    if (!roomRowId || !hasGenerated || topGroups.length === 0) return;

    setPhase("saving");
    setError(null);

    try {
      await saveRoomRound(roomRowId, {
        groups: allGroups,
        summaries,
      });
      setHasSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save summary");
    } finally {
      setPhase("idle");
    }
  }, [roomRowId, hasGenerated, allGroups, summaries, topGroups.length]);

  const beginNewRound = useCallback(async () => {
    if (!roomId || !roomRowId || !hasSaved) return;

    setPhase("saving");
    setError(null);

    try {
      await startNewRound(roomId, roomRowId);
      setEntries([]);
      resetUi();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start new round");
    } finally {
      setPhase("idle");
    }
  }, [roomId, roomRowId, hasSaved, setEntries, resetUi]);

  return {
    topGroups: hasGenerated ? topGroups : [],
    summaries: hasGenerated ? summaries : [],
    loading,
    phase,
    error,
    isHydrated,
    hasGenerated,
    hasSaved,
    pendingCount,
    entryCount: roomEntries.length,
    runSummarize,
    saveSummary,
    beginNewRound,
    roomId,
    roomRowId,
  };
}
