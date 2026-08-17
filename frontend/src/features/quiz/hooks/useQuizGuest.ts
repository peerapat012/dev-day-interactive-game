"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createQuizWorkflow,
  type QuizWorkflow,
  type QuizWorkflowState,
} from "@/lib/quizWorkflow";
import { ensureGuestSession, getAccount } from "@/services/appwrite/auth";
import {
  createAnswer,
  listAnswersByRoom,
} from "@/services/appwrite/quizAnswers";
import {
  subscribeToQuizAnswers,
  subscribeToQuizGameState,
} from "@/services/appwrite/realtimeQuiz";
import { getQuizRoomByCode, parseQuizGameState } from "@/services/appwrite/quizRooms";
import { listGuestsByRoom } from "@/services/appwrite/guests";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

export function useQuizGuest() {
  const roomId = useRoomStore((s) => s.roomId);
  const guestUuid = useRoomStore((s) => s.guestId);
  const displayName = usePlayerStore((s) => s.displayName);
  const guestMode = usePlayerStore((s) => s.guestMode);

  const [guestId, setGuestId] = useState("");
  const [wfState, setWfState] = useState<QuizWorkflowState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [workflow] = useState<QuizWorkflow>(() =>
    createQuizWorkflow({
      loadGameState: async (id) => {
        const room = await getQuizRoomByCode(id);
        return parseQuizGameState(room?.gameStateJson);
      },
      persistGameState: async () => undefined,
      listAnswers: async (id) => listAnswersByRoom(id),
      submitAnswer: async (command, answer) => createAnswer(answer),
    }),
  );

  useEffect(() => {
    const unsubscribe = workflow.subscribe(setWfState);
    return () => {
      unsubscribe();
    };
  }, [workflow]);

  useEffect(() => {
    if (!roomId || !guestUuid || !guestMode) return;

    let cancelled = false;

    async function init() {
      setError(null);
      try {
        await ensureGuestSession();
        const account = getAccount();
        const user = await account.get();
        if (cancelled) return;
        setGuestId(user.$id);

        await workflow.open(roomId);
        workflow.setSelfGuest(guestUuid);
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not open quiz");
          setReady(true);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [roomId, guestUuid, guestMode, workflow]);

  // Realtime game state (host drives phase + question).
  useEffect(() => {
    if (!roomId) return;
    let unsubscribe: (() => void) | undefined;
    void subscribeToQuizGameState(roomId, (state) => {
      void workflow.applyRemoteGameState(state);
    }).then((result) => {
      unsubscribe = result.unsubscribe;
    });
    return () => unsubscribe?.();
  }, [roomId, workflow]);

  // Realtime answers → keep podium/leaderboard fresh after reveal.
  useEffect(() => {
    if (!roomId) return;
    let unsubscribe: (() => void) | undefined;
    void subscribeToQuizAnswers(roomId, (answer) =>
      workflow.applyRemoteAnswer(answer),
    ).then((result) => {
      unsubscribe = result.unsubscribe;
    });
    return () => unsubscribe?.();
  }, [roomId, workflow]);

  // Guest list → real names on the leaderboard / podium.
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    async function refreshGuests() {
      try {
        const rows = await listGuestsByRoom(roomId);
        if (cancelled) return;
        workflow.setGuests(
          rows.map((row) => ({
            guestUuid: row.guestUuid,
            displayName: row.displayName,
          })),
        );
      } catch {
        // Ignore transient guest-list failures.
      }
    }

    void refreshGuests();
    return () => {
      cancelled = true;
    };
  }, [roomId, workflow]);

  const submit = useCallback(
    async (selectedOptionId: string): Promise<boolean> => {
      if (!guestId || !guestUuid) return false;
      const answeredAt = new Date().toISOString();
      return workflow.submitAnswer({
        guestId,
        guestUuid,
        selectedOptionId,
        answeredAt,
      });
    },
    [guestId, guestUuid, workflow],
  );

  return {
    ready,
    error,
    state: wfState,
    displayName,
    submit,
  };
}
