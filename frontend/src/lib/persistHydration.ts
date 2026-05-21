import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

/** True once the room persist slice has rehydrated from localStorage. */
export function isRoomStoreHydrated(): boolean {
  return useRoomStore.persist.hasHydrated();
}

/** Run when the room store has finished rehydrating (calls immediately if already done). */
export function onRoomStoreHydrated(callback: () => void): () => void {
  const run = () => {
    if (isRoomStoreHydrated()) callback();
  };

  const unsub = useRoomStore.persist.onFinishHydration(run);
  run();

  return unsub;
}

/** True once both guest-related persist slices have rehydrated from localStorage. */
export function areGuestStoresHydrated(): boolean {
  return usePlayerStore.persist.hasHydrated() && isRoomStoreHydrated();
}

export function onGuestStoresHydrated(callback: () => void): () => void {
  const run = () => {
    if (areGuestStoresHydrated()) callback();
  };

  const unsubPlayer = usePlayerStore.persist.onFinishHydration(run);
  const unsubRoom = useRoomStore.persist.onFinishHydration(run);
  run();

  return () => {
    unsubPlayer();
    unsubRoom();
  };
}
