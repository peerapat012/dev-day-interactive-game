"use client";

import { useEffect, useState } from "react";
import { createRoom, getRoomByCode } from "@/services/appwrite/rooms";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { useRoomStore } from "@/store/roomStore";

export function useEnsureHostRoom() {
  const roomId = useRoomStore((s) => s.roomId);
  const roomRowId = useRoomStore((s) => s.roomRowId);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setError(null);
      try {
        await ensureGuestSession();

        const { roomId: storedCode, roomRowId: storedRowId, setRoom } =
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
  }, []);

  return { ready, error, roomId, roomRowId };
}
