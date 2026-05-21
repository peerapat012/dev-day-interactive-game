"use client";

import { useEffect } from "react";
import { listEntries } from "@/services/appwrite/entries";
import { subscribeToEntries } from "@/services/appwrite/realtime";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { ENTRIES_CHANGED_EVENT } from "@/lib/entriesSync";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

const LIVE_POLL_MS = 2_000;

function isDeleteEvent(events: string[]): boolean {
  return events.some(
    (e) => e.includes(".delete") || e.endsWith(".rows.delete"),
  );
}

export function useRealtimeEntries() {
  const roomId = useRoomStore((s) => s.roomId);
  const setEntriesForRoom = useEntriesStore((s) => s.setEntriesForRoom);
  const upsertEntry = useEntriesStore((s) => s.upsertEntry);
  const removeEntry = useEntriesStore((s) => s.removeEntry);
  const setHydrated = useEntriesStore((s) => s.setHydrated);
  const setError = useEntriesStore((s) => s.setError);

  useEffect(() => {
    if (!roomId) {
      useEntriesStore.getState().setEntries([]);
      setHydrated(false);
      return;
    }

    let cancelled = false;
    let unsubscribeRealtime: (() => void) | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    async function refreshEntries() {
      const entries = await listEntries(roomId);
      if (!cancelled) setEntriesForRoom(roomId, entries);
    }

    function startPolling() {
      if (pollTimer) return;
      void refreshEntries().catch(() => undefined);
      pollTimer = setInterval(() => {
        void refreshEntries().catch(() => undefined);
      }, LIVE_POLL_MS);
    }

    async function bootstrap() {
      try {
        await ensureGuestSession();
        await refreshEntries();
        if (cancelled) return;

        setHydrated(true);
        setError(null);

        const { unsubscribe, connected } = await subscribeToEntries(
          roomId,
          (entry, events) => {
            if (cancelled) return;
            if (isDeleteEvent(events)) {
              removeEntry(entry.$id);
              return;
            }
            upsertEntry(entry);
          },
        );
        unsubscribeRealtime = unsubscribe;

        if (!connected) {
          console.info(
            "[entries] Realtime unavailable — refreshing every %ds",
            LIVE_POLL_MS / 1000,
          );
        }

        startPolling();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load entries");
          setHydrated(true);
          startPolling();
        }
      }
    }

    const onEntriesChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ roomId?: string }>).detail;
      if (!detail?.roomId || detail.roomId !== roomId) return;
      void refreshEntries().catch(() => undefined);
    };

    const onVisible = () => {
      if (!document.hidden) void refreshEntries().catch(() => undefined);
    };

    window.addEventListener(ENTRIES_CHANGED_EVENT, onEntriesChanged);
    document.addEventListener("visibilitychange", onVisible);

    void bootstrap();

    return () => {
      cancelled = true;
      unsubscribeRealtime?.();
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener(ENTRIES_CHANGED_EVENT, onEntriesChanged);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [
    roomId,
    setEntriesForRoom,
    upsertEntry,
    removeEntry,
    setHydrated,
    setError,
  ]);
}
