import { create } from "zustand";
import type { Entry } from "@/types/entry";

interface EntriesState {
  entries: Entry[];
  isHydrated: boolean;
  isSubmitting: boolean;
  error: string | null;
  setEntries: (entries: Entry[]) => void;
  /** Replace entries for one room; keep other rooms' rows if any. */
  setEntriesForRoom: (roomId: string, entries: Entry[]) => void;
  upsertEntry: (entry: Entry) => void;
  removeEntry: (id: string) => void;
  setHydrated: (value: boolean) => void;
  setSubmitting: (value: boolean) => void;
  setError: (message: string | null) => void;
}

export const useEntriesStore = create<EntriesState>((set) => ({
  entries: [],
  isHydrated: false,
  isSubmitting: false,
  error: null,
  setEntries: (entries) => set({ entries }),
  setEntriesForRoom: (roomId, entries) =>
    set((state) => ({
      entries: [
        ...entries,
        ...state.entries.filter((e) => e.roomId !== roomId),
      ],
    })),
  upsertEntry: (entry) =>
    set((state) => {
      const index = state.entries.findIndex((e) => e.$id === entry.$id);
      if (index === -1) {
        return { entries: [entry, ...state.entries] };
      }
      const next = [...state.entries];
      next[index] = entry;
      return { entries: next };
    }),
  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.$id !== id),
    })),
  setHydrated: (isHydrated) => set({ isHydrated }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
}));

export const selectEntries = (state: EntriesState) => state.entries;
