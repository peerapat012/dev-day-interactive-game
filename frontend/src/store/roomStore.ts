import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoomMode } from "@/types/quiz";

const STORAGE_KEY = "word-cloud-room";

interface RoomState {
  roomId: string;
  roomRowId: string;
  guestId: string;
  hasSubmitted: boolean;
  /** Active saved summary exists for this room (synced from Appwrite `isSummary`). */
  isSummary: boolean;
  /** Word Cloud or Quiz game mode. Defaults to "wordcloud". */
  mode: RoomMode;
  setRoom: (
    roomId: string,
    roomRowId: string,
    isSummary?: boolean,
    mode?: RoomMode,
  ) => void;
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
      mode: "wordcloud",
      setRoom: (roomId, roomRowId, isSummary = false, mode = "wordcloud") =>
        set({ roomId, roomRowId, isSummary, mode }),
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
          mode: "wordcloud",
        }),
    }),
    { name: STORAGE_KEY },
  ),
);
