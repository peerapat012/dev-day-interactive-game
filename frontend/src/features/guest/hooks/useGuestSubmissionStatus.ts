"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  guestHasSubmitted,
  isStaleGuestSessionError,
} from "@/services/appwrite/guests";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

const POLL_MS = 4_000;

/** Sync guest hasSubmitted from Appwrite (refresh, host clear/new round, polling). */
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

  const syncFromServer = useCallback(async () => {
    if (!roomId || !guestId) {
      setGuestInvalid(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      const submitted = await guestHasSubmitted(roomId, guestId);
      setGuestInvalid(false);
      setHasSubmitted(submitted);
    } catch (err) {
      if (isStaleGuestSessionError(err)) {
        useRoomStore.getState().setGuestId("");
        useRoomStore.getState().setHasSubmitted(false);
        setGuestInvalid(false);
      } else {
        setGuestInvalid(false);
      }
    } finally {
      setChecking(false);
    }
  }, [roomId, guestId, setHasSubmitted]);

  useEffect(() => {
    if (!roomId || !guestId) {
      setGuestInvalid(false);
      setChecking(false);
      return;
    }

    void syncFromServer();
  }, [roomId, guestId, roomEntryCount, syncFromServer]);

  /** Host bulk-deletes often skip realtime; re-check submission on a timer. */
  useEffect(() => {
    if (!roomId || !guestId) return;

    const id = window.setInterval(() => void syncFromServer(), POLL_MS);

    const onVisible = () => {
      if (!document.hidden) void syncFromServer();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [roomId, guestId, syncFromServer]);

  /** Local feed cleared — unlock UI until server poll confirms. */
  useEffect(() => {
    if (roomId && guestId && roomEntryCount === 0 && hasSubmitted) {
      setHasSubmitted(false);
    }
  }, [roomId, guestId, roomEntryCount, hasSubmitted, setHasSubmitted]);

  return { hasSubmitted, checking, guestInvalid };
}
