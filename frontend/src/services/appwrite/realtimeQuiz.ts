import { Channel, Query, Realtime, type RealtimeSubscription } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { getAppwriteClient } from "@/services/appwrite/client";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { parseQuizGameState } from "@/services/appwrite/quizRooms";
import type { QuizAnswer, QuizRoomGameState, RoomMode } from "@/types/quiz";

export type QuizGameStateHandler = (state: QuizRoomGameState, mode: RoomMode) => void;
export type QuizAnswerHandler = (answer: QuizAnswer) => void;

let realtimeService: Realtime | null = null;
let wsErrorLogged = false;

function getRealtimeService(): Realtime {
  if (!realtimeService) {
    realtimeService = new Realtime(getAppwriteClient());
    realtimeService.onError((err, code) => {
      if (!wsErrorLogged) {
        console.warn(
          "[quiz-realtime] WebSocket error — live updates use polling:",
          err?.message ?? code,
        );
        wsErrorLogged = true;
      }
    });
  }
  return realtimeService;
}

function mapAnswerPayload(payload: Record<string, unknown>): QuizAnswer | null {
  if (!payload || typeof payload.$id !== "string") return null;
  return {
    $id: payload.$id as string,
    roomId: (payload.roomId as string) ?? "",
    questionId: (payload.questionId as string) ?? "",
    guestId: (payload.guestId as string) ?? "",
    guestUuid: (payload.guestUuid as string) ?? "",
    selectedOptionId: (payload.selectedOption as string) ?? "",
    answeredAt: (payload.answeredAt as string) ?? new Date().toISOString(),
    isCorrect: Boolean(payload.isCorrect),
    points: (payload.points as number) ?? 0,
  };
}

export type SubscribeResult = {
  unsubscribe: () => void;
  connected: boolean;
};

function guard() {
  return Boolean(
    APPWRITE.databaseId && APPWRITE.roomsTableId && APPWRITE.answersTableId,
  );
}

/** Subscribe to quiz game-state changes (rooms table) for one room. */
export async function subscribeToQuizGameState(
  roomId: string,
  onEvent: QuizGameStateHandler,
): Promise<SubscribeResult> {
  if (!guard() || !roomId.trim()) {
    return { connected: false, unsubscribe: () => undefined };
  }

  await ensureGuestSession();

  const channel = Channel.tablesdb(APPWRITE.databaseId)
    .table(APPWRITE.roomsTableId)
    .row();

  try {
    const realtime = getRealtimeService();
    const subscription: RealtimeSubscription = await realtime.subscribe(
      [channel],
      (response) => {
        const payload = response.payload as Record<string, unknown> | undefined;
        if (!payload || (payload.roomId as string) !== roomId) return;
        const state = parseQuizGameState(payload.gameStateJson as string);
        if (!state) return;
        onEvent(state, (payload.mode as RoomMode) ?? "wordcloud");
      },
      [Query.equal("roomId", roomId)],
    );

    return {
      connected: true,
      unsubscribe: () => {
        void subscription.unsubscribe();
      },
    };
  } catch (err) {
    console.warn("[quiz-realtime] subscribe game state failed:", err);
    return { connected: false, unsubscribe: () => undefined };
  }
}

/** Subscribe to answer rows (answers table) for one room. */
export async function subscribeToQuizAnswers(
  roomId: string,
  onEvent: QuizAnswerHandler,
): Promise<SubscribeResult> {
  if (!guard() || !roomId.trim()) {
    return { connected: false, unsubscribe: () => undefined };
  }

  await ensureGuestSession();

  const channel = Channel.tablesdb(APPWRITE.databaseId)
    .table(APPWRITE.answersTableId)
    .row();

  try {
    const realtime = getRealtimeService();
    const subscription: RealtimeSubscription = await realtime.subscribe(
      [channel],
      (response) => {
        const payload = response.payload as Record<string, unknown> | undefined;
        const answer = mapAnswerPayload(payload ?? {});
        if (!answer || answer.roomId !== roomId) return;
        onEvent(answer);
      },
      [Query.equal("roomId", roomId)],
    );

    return {
      connected: true,
      unsubscribe: () => {
        void subscription.unsubscribe();
      },
    };
  } catch (err) {
    console.warn("[quiz-realtime] subscribe answers failed:", err);
    return { connected: false, unsubscribe: () => undefined };
  }
}

/** Full teardown (e.g. leaving a quiz room). */
export async function closeQuizRealtime(): Promise<void> {
  if (realtimeService) {
    await realtimeService.disconnect();
    realtimeService = null;
    wsErrorLogged = false;
  }
}