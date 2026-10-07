"use client";

import { useEffect } from "react";
import { getRoomByCode } from "@/services/appwrite/rooms";
import { subscribeToRoomMode } from "@/services/appwrite/realtime";
import { useRoomStore } from "@/store/roomStore";

const POLL_MS = 4000;

/**
 * Keep the guest's `mode` in sync when the host switches mode in place.
 * Realtime for instant flips, plus polling/visibility as a fallback.
 */
export function useRoomModeSync(active: boolean) {
  const roomCode = useRoomStore((s) => s.roomId);

  useEffect(() => {
    if (!active || !roomCode) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const apply = (mode: "wordcloud" | "quiz") => {
      if (cancelled) return;
      const { mode: current, setMode } = useRoomStore.getState();
      if (current !== mode) setMode(mode);
    };

    async function poll() {
      try {
        const room = await getRoomByCode(roomCode);
        if (room) apply(room.mode);
      } catch {
        /* transient network; retry on next tick */
      }
    }

    void subscribeToRoomMode(roomCode, apply).then((result) => {
      if (cancelled) result.unsubscribe();
      else unsubscribe = result.unsubscribe;
    });

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      unsubscribe?.();
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, roomCode]);
}
