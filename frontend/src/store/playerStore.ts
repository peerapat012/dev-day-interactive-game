import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "word-cloud-player";

interface PlayerState {
  displayName: string;
  setDisplayName: (name: string) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      displayName: "",
      setDisplayName: (displayName) => set({ displayName }),
      clearPlayer: () => set({ displayName: "" }),
    }),
    { name: STORAGE_KEY },
  ),
);
