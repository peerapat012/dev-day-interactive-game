import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

/**
 * Clears host-side room persistence and in-memory entries only.
 * Does not clear the player slice (host is not a QR guest).
 */
export function leaveHostRoom(): void {
  useEntriesStore.setState({
    entries: [],
    error: null,
    isSubmitting: false,
  });
  useRoomStore.getState().clearRoom();
  useRoomStore.persist.clearStorage();
}
