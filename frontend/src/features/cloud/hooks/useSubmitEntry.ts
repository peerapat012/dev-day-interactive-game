"use client";

import { useCallback } from "react";
import { PENDING_GROUP } from "@/lib/constants";
import { notifyEntriesChanged } from "@/lib/entriesSync";
import { createEntry } from "@/services/appwrite/entries";
import {
  guestHasSubmitted,
  markGuestSubmitted,
} from "@/services/appwrite/guests";
import { useEntriesStore } from "@/store/entriesStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

const ALREADY_SUBMITTED_MSG =
  "You already sent your phrase. Each guest can only submit once.";

export function useSubmitEntry() {
  const isSubmitting = useEntriesStore((s) => s.isSubmitting);
  const setSubmitting = useEntriesStore((s) => s.setSubmitting);
  const setError = useEntriesStore((s) => s.setError);
  const upsertEntry = useEntriesStore((s) => s.upsertEntry);
  const displayName = usePlayerStore((s) => s.displayName);
  const roomId = useRoomStore((s) => s.roomId);
  const guestId = useRoomStore((s) => s.guestId);
  const hasSubmitted = useRoomStore((s) => s.hasSubmitted);
  const setHasSubmitted = useRoomStore((s) => s.setHasSubmitted);

  const submit = useCallback(
    async (rawInput: string) => {
      const input = rawInput.trim();
      if (!input || isSubmitting) return;

      if (!roomId || !guestId) {
        setError("Join a room before sending a phrase.");
        return;
      }

      if (hasSubmitted) {
        setError(ALREADY_SUBMITTED_MSG);
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const already = await guestHasSubmitted(roomId, guestId);
        if (already) {
          setHasSubmitted(true);
          setError(ALREADY_SUBMITTED_MSG);
          return;
        }

        const entry = await createEntry({
          name: displayName.trim() || "guest",
          input,
          group: PENDING_GROUP,
          roomId,
          guestId,
          createdAt: new Date().toISOString(),
        });

        await markGuestSubmitted(guestId);
        setHasSubmitted(true);
        upsertEntry(entry);
        notifyEntriesChanged(roomId);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          if (err.message.includes("session expired")) {
            setHasSubmitted(true);
          }
        } else {
          setError("Submit failed");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [
      isSubmitting,
      hasSubmitted,
      setSubmitting,
      setError,
      upsertEntry,
      displayName,
      roomId,
      guestId,
      setHasSubmitted,
    ],
  );

  return { submit, isSubmitting, hasSubmitted };
}
