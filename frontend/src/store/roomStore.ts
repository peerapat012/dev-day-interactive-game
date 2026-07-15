import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "word-cloud-room";

interface RoomState {
  roomId: string;
  roomRowId: string;
  guestId: string;
  hasSubmitted: boolean;
  /** Active saved summary exists for this room (synced from Appwrite `isSummary`). */
  isSummary: boolean;
  setRoom: (roomId: string, roomRowId: string, isSummary?: boolean) => void;
  setIsSummary: (isSummary: boolean) => void;
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
      isSummary: false,
      setRoom: (roomId, roomRowId, isSummary = false) =>
        set({ roomId, roomRowId, isSummary }),
      setIsSummary: (isSummary) => set({ isSummary }),
      setGuestId: (guestId) => set({ guestId }),
      setHasSubmitted: (hasSubmitted) => set({ hasSubmitted }),
      clearRoom: () =>
        set({
          roomId: "",
          roomRowId: "",
          guestId: "",
          hasSubmitted: false,
          isSummary: false,
        }),
    }),
    { name: STORAGE_KEY },
  ),
);
