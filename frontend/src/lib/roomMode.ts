import { HOST_PATH, QUIZ_HOST_PATH } from "@/lib/hostPaths";
import type { RoomMode } from "@/types/quiz";

export function otherMode(mode: RoomMode): RoomMode {
  return mode === "quiz" ? "wordcloud" : "quiz";
}

export function hostPathForMode(mode: RoomMode): string {
  return mode === "quiz" ? QUIZ_HOST_PATH : HOST_PATH;
}

export function modeLabel(mode: RoomMode): string {
  return mode === "quiz" ? "Quiz" : "Word Cloud";
}
