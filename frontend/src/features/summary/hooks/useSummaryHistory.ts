"use client";

import { useCallback, useEffect, useState } from "react";
import { getSavedRounds } from "@/services/appwrite/rooms";
import type { SavedRoundSnapshot } from "@/types/room";

export function useSummaryHistory(roomRowId: string | undefined, enabled: boolean) {
  const [rounds, setRounds] = useState<SavedRoundSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!roomRowId) {
      setRounds([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const snapshots = await getSavedRounds(roomRowId);
      setRounds(
        [...snapshots].sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
        ),
      );
    } catch (err) {
      setRounds([]);
      setError(err instanceof Error ? err.message : "Could not load history");
    } finally {
      setLoading(false);
    }
  }, [roomRowId]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return { rounds, loading, error, refresh: load };
}
