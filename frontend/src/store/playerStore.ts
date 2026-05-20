import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "word-cloud-player";

interface PlayerState {
  displayName: string;
  /** True when the player joined via the guest (QR) flow. */
  guestMode: boolean;
  setDisplayName: (name: string) => void;
  setGuestMode: (guestMode: boolean) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      displayName: "",
      guestMode: false,
      setDisplayName: (displayName) => set({ displayName }),
      setGuestMode: (guestMode) => set({ guestMode }),
      clearPlayer: () => set({ displayName: "", guestMode: false }),
    }),
    { name: STORAGE_KEY },
  ),
);
