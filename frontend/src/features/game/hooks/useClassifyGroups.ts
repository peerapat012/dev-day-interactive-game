"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildGroupStats,
  isClassifiedEntry,
} from "@/lib/aggregateEntries";
import { classifyAndBuildGroups } from "@/lib/classifyAndBuildGroups";
import { updateRoomSnapshot } from "@/services/appwrite/rooms";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

export function useClassifyGroups() {
  const entries = useEntriesStore((s) => s.entries);
  const upsertEntry = useEntriesStore((s) => s.upsertEntry);
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const roomId = useRoomStore((s) => s.roomId);
  const roomRowId = useRoomStore((s) => s.roomRowId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomEntries = useMemo(
    () => (roomId ? entries.filter((e) => e.roomId === roomId) : []),
    [entries, roomId],
  );

  const groups = useMemo(() => buildGroupStats(roomEntries), [roomEntries]);

  const pendingCount = useMemo(
    () => roomEntries.filter((e) => !isClassifiedEntry(e)).length,
    [roomEntries],
  );

  const classifiedCount = useMemo(
    () => roomEntries.filter((e) => isClassifiedEntry(e)).length,
    [roomEntries],
  );

  const runClassify = useCallback(async () => {
    if (pendingCount === 0 || loading || !roomRowId) return;

    setLoading(true);
    setError(null);

    try {
      const updatedGroups = await classifyAndBuildGroups(roomEntries, upsertEntry);
      await updateRoomSnapshot(roomRowId, { groups: updatedGroups });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed");
    } finally {
      setLoading(false);
    }
  }, [roomEntries, loading, pendingCount, roomRowId, upsertEntry]);

  return {
    groups,
    loading,
    error,
    isHydrated,
    pendingCount,
    classifiedCount,
    entryCount: roomEntries.length,
    runClassify,
    roomId,
  };
}
