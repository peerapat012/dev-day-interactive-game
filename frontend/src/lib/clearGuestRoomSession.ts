import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

/** Clear persisted room/guest session only (keeps nickname / guestMode flags). */
export function clearGuestRoomSession(): void {
  useEntriesStore.setState({
    entries: [],
    error: null,
    isSubmitting: false,
  });
  useRoomStore.getState().clearRoom();
  useRoomStore.persist.clearStorage();
}
