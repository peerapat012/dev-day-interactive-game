"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { createRoom, getRoomByCode } from "@/services/appwrite/rooms";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

export function useHostRoom() {
  const roomId = useRoomStore((s) => s.roomId);
  const roomRowId = useRoomStore((s) => s.roomRowId);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setEntries = useEntriesStore((s) => s.setEntries);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setError(null);
      try {
        await ensureGuestSession();

        const { roomId: storedCode, roomRowId: storedRowId } =
          useRoomStore.getState();

        if (storedCode && storedRowId) {
          const existing = await getRoomByCode(storedCode);
          if (existing && !cancelled) {
            setReady(true);
            return;
          }
        }

        const room = await createRoom();
        if (!cancelled) {
          setRoom(room.roomId, room.$id);
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
  }, [setRoom, setEntries]);

  const createNewRoom = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      await ensureGuestSession();
      const room = await createRoom();
      setRoom(room.roomId, room.$id);
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
