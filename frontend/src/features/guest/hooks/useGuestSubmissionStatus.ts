"use client";

import { useEffect, useMemo, useState } from "react";
import { guestHasSubmitted } from "@/services/appwrite/guests";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

/** Sync guest hasSubmitted from Appwrite (e.g. after page refresh). */
export function useGuestSubmissionStatus() {
  const roomId = useRoomStore((s) => s.roomId);
  const guestId = useRoomStore((s) => s.guestId);
  const hasSubmitted = useRoomStore((s) => s.hasSubmitted);
  const setHasSubmitted = useRoomStore((s) => s.setHasSubmitted);
  const entries = useEntriesStore((s) => s.entries);
  const [checking, setChecking] = useState(true);
  const [guestInvalid, setGuestInvalid] = useState(false);

  const roomEntryCount = useMemo(
    () => (roomId ? entries.filter((e) => e.roomId === roomId).length : 0),
    [entries, roomId],
  );

  useEffect(() => {
    if (!roomId || !guestId) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    void guestHasSubmitted(roomId, guestId)
      .then((submitted) => {
        if (!cancelled) setHasSubmitted(submitted);
      })
      .catch(() => {
        if (!cancelled) {
          setGuestInvalid(true);
          setHasSubmitted(false);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, guestId, roomEntryCount, setHasSubmitted]);

  return { hasSubmitted, checking, guestInvalid };
}
