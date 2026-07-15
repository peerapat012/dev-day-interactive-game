"use client";

import { useCallback, useEffect, useState } from "react";
import { onRoomStoreHydrated } from "@/lib/persistHydration";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { leaveHostRoom } from "@/lib/leaveHostRoom";
import { createRoom, getRoomByCode } from "@/services/appwrite/rooms";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

export function useHostRoom() {
  const roomId = useRoomStore((s) => s.roomId);
  const roomRowId = useRoomStore((s) => s.roomRowId);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setEntries = useEntriesStore((s) => s.setEntries);
  const [storeHydrated, setStoreHydrated] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => onRoomStoreHydrated(() => setStoreHydrated(true)), []);

  useEffect(() => {
    if (!storeHydrated) return;

    let cancelled = false;

    async function init() {
      setError(null);
      try {
        await ensureGuestSession();

        const { roomId: storedCode, roomRowId: storedRowId } =
          useRoomStore.getState();

        if (storedCode && !storedRowId.trim()) {
          leaveHostRoom();
        }

        if (storedCode && storedRowId.trim()) {
          const existing = await getRoomByCode(storedCode);
          if (cancelled) return;

          if (existing && existing.$id === storedRowId) {
            setRoom(existing.roomId, existing.$id, existing.isSummary);
            setReady(true);
            return;
          }

          if (existing && existing.$id !== storedRowId) {
            leaveHostRoom();
            if (cancelled) return;
            setRoom(existing.roomId, existing.$id, existing.isSummary);
            setEntries([]);
            setReady(true);
            return;
          }

          leaveHostRoom();
        }

        const room = await createRoom();
        if (!cancelled) {
          setRoom(room.roomId, room.$id, room.isSummary);
          setEntries([]);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not create room");
          setReady(true);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [storeHydrated, setRoom, setEntries]);

  const createNewRoom = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      await ensureGuestSession();
      const room = await createRoom();
      setRoom(room.roomId, room.$id, room.isSummary);
      setEntries([]);
      return room.roomId;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create room";
      setError(message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [setRoom, setEntries]);

  return {
    ready,
    error,
    roomId,
    roomRowId,
    creating,
    createNewRoom,
  };
}
