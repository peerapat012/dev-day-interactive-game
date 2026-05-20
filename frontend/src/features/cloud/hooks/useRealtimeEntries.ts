"use client";

import { useEffect } from "react";
import { listEntries } from "@/services/appwrite/entries";
import { subscribeToEntries } from "@/services/appwrite/realtime";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

const POLL_MS = 12_000;

export function useRealtimeEntries() {
  const roomId = useRoomStore((s) => s.roomId);
  const setEntries = useEntriesStore((s) => s.setEntries);
  const upsertEntry = useEntriesStore((s) => s.upsertEntry);
  const removeEntry = useEntriesStore((s) => s.removeEntry);
  const setHydrated = useEntriesStore((s) => s.setHydrated);
  const setError = useEntriesStore((s) => s.setError);

  useEffect(() => {
    if (!roomId) {
      setEntries([]);
      setHydrated(false);
      return;
    }

    let cancelled = false;
    let unsubscribeRealtime: (() => void) | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    async function refreshEntries() {
      const entries = await listEntries(roomId);
      if (!cancelled) setEntries(entries);
    }

    function startPolling() {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        void refreshEntries().catch(() => undefined);
      }, POLL_MS);
    }

    async function bootstrap() {
      try {
        await ensureGuestSession();
        await refreshEntries();
        if (cancelled) return;

        setHydrated(true);
        setError(null);

        const { unsubscribe, connected } = await subscribeToEntries(
          (entry, events) => {
            if (cancelled || entry.roomId !== roomId) return;
            const isDelete = events.some((e) => e.includes(".delete"));
            if (isDelete) {
              removeEntry(entry.$id);
              return;
            }
            upsertEntry(entry);
          },
        );
        unsubscribeRealtime = unsubscribe;

        if (!connected) {
          startPolling();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load entries");
          setHydrated(true);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      unsubscribeRealtime?.();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [
    roomId,
    setEntries,
    upsertEntry,
    removeEntry,
    setHydrated,
    setError,
  ]);
}
