"use client";

import { useEffect, useRef } from "react";
import { leaveGuestRoom } from "@/lib/leaveGuestRoom";
import { getRoomByCode } from "@/services/appwrite/rooms";
import { useRoomStore } from "@/store/roomStore";

const POLL_MS = 5000;

/**
 * While the guest is in-session, poll the room row — if the host closed the session,
 * clear this device like “Leave room”.
 */
export function useRoomClosedKick(active: boolean, onKicked: () => void) {
  const roomCode = useRoomStore((s) => s.roomId);
  const warnedRef = useRef(false);
  const onKickedRef = useRef(onKicked);
  onKickedRef.current = onKicked;

  useEffect(() => {
    warnedRef.current = false;
  }, [roomCode, active]);

  useEffect(() => {
    if (!active || !roomCode) return;

    let cancelled = false;

    async function check() {
      try {
        const room = await getRoomByCode(roomCode);
        if (cancelled || warnedRef.current) return;
        if (!room) {
          warnedRef.current = true;
          leaveGuestRoom();
          onKickedRef.current();
          window.alert(
            "The host ended this session. This device was cleared — join again with a fresh QR from the host.",
          );
        }
      } catch {
        /* transient network; retry on next tick */
      }
    }

    void check();
    const id = window.setInterval(() => void check(), POLL_MS);

    const onVisible = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, roomCode]);
}
