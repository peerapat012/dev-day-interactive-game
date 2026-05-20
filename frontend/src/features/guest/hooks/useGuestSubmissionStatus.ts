"use client";

import { useEffect, useMemo, useState } from "react";
import {
  guestHasSubmitted,
  isStaleGuestSessionError,
} from "@/services/appwrite/guests";
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
      setGuestInvalid(false);
      setChecking(false);
      return;
    }

    let cancelled = false;

    void guestHasSubmitted(roomId, guestId)
      .then((submitted) => {
        if (!cancelled) {
          setGuestInvalid(false);
          setHasSubmitted(submitted);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (isStaleGuestSessionError(err)) {
            // Host cleared data or wiped guests: drop stale persisted guestUuid so QR rejoin hits the join form.
            useRoomStore.getState().setGuestId("");
            useRoomStore.getState().setHasSubmitted(false);
            setGuestInvalid(false);
          } else {
            setGuestInvalid(false);
          }
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
