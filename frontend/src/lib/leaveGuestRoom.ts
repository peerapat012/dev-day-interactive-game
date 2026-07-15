import { bumpJoinFormEpoch } from "@/lib/guestJoinEpoch";
import { useEntriesStore } from "@/store/entriesStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

/** localStorage keys (must match zustand `persist({ name })`). */
export const WORD_CLOUD_STORAGE_KEYS = {
  room: "word-cloud-room",
  player: "word-cloud-player",
} as const;

/**
 * Leave the guest room on this browser: resets room + nickname + guest mode and
 * removes persisted slices from localStorage. Does not touch Appwrite.
 * Does not change the URL — use resetGuestJoinSession when the join form must remount.
 */
export async function leaveGuestRoom(): Promise<void> {
  bumpJoinFormEpoch();

  useEntriesStore.setState({
    entries: [],
    error: null,
    isSubmitting: false,
  });

  useRoomStore.getState().clearRoom();
  usePlayerStore.getState().clearPlayer();

  await useRoomStore.persist.clearStorage();
  await usePlayerStore.persist.clearStorage();
}
