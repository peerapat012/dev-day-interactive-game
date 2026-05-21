import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

/** True once both guest-related persist slices have rehydrated from localStorage. */
export function areGuestStoresHydrated(): boolean {
  return (
    usePlayerStore.persist.hasHydrated() &&
    useRoomStore.persist.hasHydrated()
  );
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
