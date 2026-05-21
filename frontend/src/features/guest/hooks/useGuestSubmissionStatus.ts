"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const roomEntryCount = useEntriesStore((s) =>
    s.entries.filter((e) => e.roomId === roomId).length,
  );
  const [checking, setChecking] = useState(true);
  const [guestInvalid, setGuestInvalid] = useState(false);
  const initialSyncDone = useRef(false);

  const syncFromServer = useCallback(
    async (opts?: { showChecking?: boolean }) => {
      if (!roomId || !guestId) {
        setGuestInvalid(false);
        setChecking(false);
        return;
      }

      if (opts?.showChecking) setChecking(true);

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
        initialSyncDone.current = true;
      }
    },
    [roomId, guestId, setHasSubmitted],
  );

  useEffect(() => {
    initialSyncDone.current = false;
    if (!roomId || !guestId) {
      setGuestInvalid(false);
      setChecking(false);
      return;
    }
    void syncFromServer({ showChecking: true });
  }, [roomId, guestId, syncFromServer]);

  useEffect(() => {
    if (!roomId || !guestId) return;

    const id = window.setInterval(
      () => void syncFromServer({ showChecking: false }),
      POLL_MS,
    );

    const onVisible = () => {
      if (!document.hidden) void syncFromServer({ showChecking: false });
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [roomId, guestId, syncFromServer]);

  /** After host clears entries, unlock locally until server confirms. */
  useEffect(() => {
    if (roomId && guestId && roomEntryCount === 0 && hasSubmitted) {
      setHasSubmitted(false);
    }
  }, [roomId, guestId, roomEntryCount, hasSubmitted, setHasSubmitted]);

  /** Entry list changed — refresh submission flag without flashing the footer. */
  useEffect(() => {
    if (!initialSyncDone.current || !roomId || !guestId) return;
    void syncFromServer({ showChecking: false });
  }, [roomEntryCount, roomId, guestId, syncFromServer]);

  return { hasSubmitted, checking, guestInvalid };
}
