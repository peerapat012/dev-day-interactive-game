import { clearGuestJoinRoomDraft } from "@/lib/guestJoinDraft";
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
 */
export function leaveGuestRoom(): void {
  clearGuestJoinRoomDraft();
  useEntriesStore.setState({
    entries: [],
    error: null,
    isSubmitting: false,
  });

  useRoomStore.getState().clearRoom();
  usePlayerStore.getState().clearPlayer();

  useRoomStore.persist.clearStorage();
  usePlayerStore.persist.clearStorage();
}
