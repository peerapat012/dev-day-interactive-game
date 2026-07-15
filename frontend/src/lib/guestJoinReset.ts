import { bumpJoinFormEpoch } from "@/lib/guestJoinEpoch";
import { GUEST_PATH } from "@/lib/guestPaths";
import { useEntriesStore } from "@/store/entriesStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

/**
 * Full guest session reset: memory, localStorage persist, and URL (drops stale `?room=`).
 * Returns the new join-form epoch so inputs remount empty.
 */
export async function resetGuestJoinSession(
  replaceUrl: (path: string) => void,
): Promise<number> {
  const epoch = bumpJoinFormEpoch();

  useEntriesStore.setState({
    entries: [],
    error: null,
    isSubmitting: false,
  });

  useRoomStore.getState().clearRoom();
  usePlayerStore.getState().clearPlayer();

  await useRoomStore.persist.clearStorage();
  await usePlayerStore.persist.clearStorage();

  replaceUrl(GUEST_PATH);

  return epoch;
}
