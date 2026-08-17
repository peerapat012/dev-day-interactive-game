import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "word-cloud-quiz-host";

interface QuizHostState {
  roomId: string;
  roomRowId: string;
  setRoom: (roomId: string, roomRowId: string) => void;
  clearRoom: () => void;
}

export const useQuizHostStore = create<QuizHostState>()(
  persist(
    (set) => ({
      roomId: "",
      roomRowId: "",
      setRoom: (roomId, roomRowId) => set({ roomId, roomRowId }),
      clearRoom: () => set({ roomId: "", roomRowId: "" }),
    }),
    { name: STORAGE_KEY },
  ),
);
