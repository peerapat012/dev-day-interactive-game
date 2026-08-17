import { TablesDB } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { getAppwriteClient } from "@/services/appwrite/client";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { createRoomWithMode, getRoomByCode } from "@/services/appwrite/rooms";
import type { QuizRoomGameState } from "@/types/quiz";
import type { Room } from "@/types/room";

function getTablesDB() {
  return new TablesDB(getAppwriteClient());
}

function assertConfig(): void {
  if (!APPWRITE.databaseId || !APPWRITE.roomsTableId) {
    throw new Error(
      "Missing Appwrite env: NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_ROOMS_TABLE_ID",
    );
  }
}

export const EMPTY_QUIZ_GAME_STATE: QuizRoomGameState = {
  phase: "lobby",
  currentQuestionIndex: -1,
  currentQuestion: null,
  questionStartedAtMs: null,
};

export function parseQuizGameState(raw: string | null | undefined): QuizRoomGameState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QuizRoomGameState;
    if (!parsed || typeof parsed.phase !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createQuizRoom(): Promise<Room> {
  return createRoomWithMode("quiz");
}

export async function getQuizRoomByCode(roomCode: string): Promise<Room | null> {
  await ensureGuestSession();
  assertConfig();
  const room = await getRoomByCode(roomCode);
  return room && room.mode === "quiz" ? room : null;
}

/** Persist the quiz host game state as `gameStateJson` on the room row. */
export async function persistQuizGameState(
  roomRowId: string,
  state: QuizRoomGameState,
): Promise<void> {
  await ensureGuestSession();
  assertConfig();

  await getTablesDB().updateRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.roomsTableId,
    rowId: roomRowId,
    data: {
      gameStateJson: JSON.stringify(state),
      updatedAt: new Date().toISOString(),
    },
  });
}