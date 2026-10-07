"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { hostPathForMode, modeLabel, otherMode } from "@/lib/roomMode";
import { switchRoomMode } from "@/services/appwrite/rooms";
import { confirmDialog } from "@/shared/feedback/dialogStore";
import { toast } from "@/shared/feedback/toastStore";
import { useEntriesStore } from "@/store/entriesStore";
import { useQuizHostStore } from "@/store/quizHostStore";
import { useRoomStore } from "@/store/roomStore";
import type { RoomMode } from "@/types/quiz";

/**
 * Host-side mode switch: flips `rooms.mode` (guests follow via realtime/poll),
 * hands the same room to the other host store, and opens the other host page.
 */
export function useSwitchRoomMode(
  current: RoomMode,
  roomId: string,
  roomRowId: string,
) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const target = otherMode(current);

  const switchMode = useCallback(async () => {
    const confirmed = await confirmDialog({
      title: `Switch to ${modeLabel(target)}?`,
      message:
        target === "quiz"
          ? "The room code stays the same and guests move to the quiz lobby. Word cloud phrases are kept."
          : "The room code stays the same and guests return to the word cloud. Quiz progress is not kept.",
      confirmLabel: `Switch to ${modeLabel(target)}`,
    });
    if (!confirmed) return;

    setSwitching(true);
    try {
      const room = await switchRoomMode(roomRowId, roomId, target);
      if (target === "quiz") {
        useQuizHostStore.getState().setRoom(room.roomId, room.$id);
      } else {
        useEntriesStore.getState().setEntries([]);
        useRoomStore
          .getState()
          .setRoom(room.roomId, room.$id, room.isSummary, room.mode);
        useQuizHostStore.getState().clearRoom();
      }
      router.replace(hostPathForMode(target));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not switch mode",
      );
    } finally {
      setSwitching(false);
    }
  }, [target, roomId, roomRowId, router]);

  return { switching, target, switchMode };
}
