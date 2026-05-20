import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "word-cloud-room";

interface RoomState {
  roomId: string;
  roomRowId: string;
  guestId: string;
  hasSubmitted: boolean;
  setRoom: (roomId: string, roomRowId: string) => void;
  setGuestId: (guestId: string) => void;
  setHasSubmitted: (hasSubmitted: boolean) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      roomId: "",
      roomRowId: "",
      guestId: "",
      hasSubmitted: false,
      setRoom: (roomId, roomRowId) => set({ roomId, roomRowId }),
      setGuestId: (guestId) => set({ guestId }),
      setHasSubmitted: (hasSubmitted) => set({ hasSubmitted }),
      clearRoom: () =>
        set({ roomId: "", roomRowId: "", guestId: "", hasSubmitted: false }),
    }),
    { name: STORAGE_KEY },
  ),
);
