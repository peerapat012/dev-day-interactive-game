"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createQuizWorkflow,
  type QuizWorkflow,
  type QuizWorkflowState,
} from "@/lib/quizWorkflow";
import { ensureGuestSession } from "@/services/appwrite/auth";
import {
  getQuizAuthUser,
  loginWithEmail,
  logoutQuizAuth,
  registerWithEmail,
  type QuizAuthUser,
} from "@/services/appwrite/quizAuth";
import {
  createQuizRoom,
  getQuizRoomByCode,
  parseQuizGameState,
  persistQuizGameState,
} from "@/services/appwrite/quizRooms";
import {
  createAnswer,
  listAnswersByRoom,
} from "@/services/appwrite/quizAnswers";
import { subscribeToQuizAnswers } from "@/services/appwrite/realtimeQuiz";
import { listGuestsByRoom } from "@/services/appwrite/guests";
import {
  clearLocalDeck,
  createQuestionDeck,
  deleteQuestionDeck,
  listMyDecks,
  loadLocalDeck,
  saveLocalDeck,
  type SavedQuestionDeck,
} from "@/services/appwrite/quizDecks";
import { useQuizHostStore } from "@/store/quizHostStore";
import type { QuestionDeck, QuizGuest } from "@/types/quiz";

export function useQuizHost() {
  const roomId = useQuizHostStore((s) => s.roomId);
  const roomRowId = useQuizHostStore((s) => s.roomRowId);
  const setRoom = useQuizHostStore((s) => s.setRoom);

  const [storeHydrated, setStoreHydrated] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [deck, setDeck] = useState<QuestionDeck | null>(null);
  const [guests, setGuests] = useState<QuizGuest[]>([]);
  const [wfState, setWfState] = useState<QuizWorkflowState | null>(null);

  const [user, setUser] = useState<QuizAuthUser | null>(null);
  const [savedDecks, setSavedDecks] = useState<SavedQuestionDeck[]>([]);

  const [workflow] = useState<QuizWorkflow>(() =>
    createQuizWorkflow({
      loadGameState: async (id) => {
        const room = await getQuizRoomByCode(id);
        return parseQuizGameState(room?.gameStateJson);
      },
      persistGameState: async (id, state) => {
        const rowId = useQuizHostStore.getState().roomRowId;
        if (!rowId) return;
        await persistQuizGameState(rowId, state);
      },
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
    const run = () => setStoreHydrated(true);
    const unsub = useQuizHostStore.persist.onFinishHydration(run);
    if (useQuizHostStore.persist.hasHydrated()) run();
    return unsub;
  }, []);

  useEffect(() => {
    if (!storeHydrated) return;

    let cancelled = false;

    async function init() {
      setError(null);
      try {
        await ensureGuestSession();

        let code = useQuizHostStore.getState().roomId;
        let rowId = useQuizHostStore.getState().roomRowId;

        if (code && rowId) {
          const existing = await getQuizRoomByCode(code);
          if (existing && existing.$id === rowId) {
            // Resume the same room (game state reloads below).
          } else {
            code = "";
            rowId = "";
            useQuizHostStore.getState().clearRoom();
          }
        }

        if (!code || !rowId) {
          const room = await createQuizRoom();
          code = room.roomId;
          rowId = room.$id;
          setRoom(code, rowId);
        }

        await workflow.open(code);
        setDeck(loadLocalDeck());

        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not open quiz host",
          );
          setReady(true);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [storeHydrated, setRoom, workflow]);

  // Realtime answers → live chart + leaderboard.
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

  // Guest list (names for leaderboard, lobby count).
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    async function refreshGuests() {
      try {
        const rows = await listGuestsByRoom(roomId);
        if (cancelled) return;
        const next = rows.map((row) => ({
          guestUuid: row.guestUuid,
          displayName: row.displayName,
        }));
        setGuests(next);
        workflow.setGuests(next);
      } catch {
        // Ignore transient guest-list failures.
      }
    }

    void refreshGuests();
    const timer = setInterval(() => void refreshGuests(), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [roomId, workflow]);

  // Auth bootstrap.
  useEffect(() => {
    let cancelled = false;
    void getQuizAuthUser().then((u) => {
      if (!cancelled) setUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshDecks = useCallback(async () => {
    try {
      const rows = await listMyDecks();
      setSavedDecks(rows);
    } catch {
      setSavedDecks([]);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await loginWithEmail(email, password);
      setUser(u);
      await refreshDecks();
    },
    [refreshDecks],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const u = await registerWithEmail(name, email, password);
      setUser(u);
      await refreshDecks();
    },
    [refreshDecks],
  );

  const logout = useCallback(async () => {
    await logoutQuizAuth();
    setUser(null);
    setSavedDecks([]);
  }, []);

  const saveDeckToCloud = useCallback(
    async (draft: QuestionDeck) => {
      const saved = await createQuestionDeck(draft);
      setSavedDecks((prev) => [saved, ...prev]);
      return saved;
    },
    [],
  );

  const deleteDeckFromCloud = useCallback(
    async (rowId: string) => {
      await deleteQuestionDeck(rowId);
      setSavedDecks((prev) => prev.filter((deck) => deck.$id !== rowId));
    },
    [],
  );

  const startGame = useCallback(
    async (draft: QuestionDeck) => {
      saveLocalDeck(draft);
      setDeck(draft);
      await workflow.startGame(draft);
    },
    [workflow],
  );

  const startQuestion = useCallback(
    (index: number) => void workflow.startQuestion(index),
    [workflow],
  );

  const reveal = useCallback(() => void workflow.reveal(), [workflow]);
  const showLeaderboard = useCallback(
    () => void workflow.showLeaderboard(),
    [workflow],
  );
  const nextQuestion = useCallback(
    () => void workflow.nextQuestion(),
    [workflow],
  );
  const endGame = useCallback(() => {
    if (workflow.getState().phase === "podium") {
      clearLocalDeck();
      setDeck(null);
      setGuests([]);
    }
    void workflow.endGame();
  }, [workflow]);

  /** Back to the deck editor from anywhere in-game (same room, deck preserved). */
  const backToEditor = useCallback(() => {
    workflow.clearSession();
    setDeck(loadLocalDeck());
    setGuests([]);
  }, [workflow]);

  /** Wipe the local deck and start a fresh room (for unauthenticated hosts). */
  const clearSession = useCallback(async () => {
    clearLocalDeck();
    setDeck(null);
    setGuests([]);
    workflow.clearSession();
    await ensureGuestSession();
    const room = await createQuizRoom();
    setRoom(room.roomId, room.$id);
    await workflow.open(room.roomId);
  }, [setRoom, workflow]);

  const createNewRoom = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      await ensureGuestSession();
      const room = await createQuizRoom();
      setRoom(room.roomId, room.$id);
      await workflow.open(room.roomId);
      setDeck(loadLocalDeck());
      return room.roomId;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create quiz room";
      setError(message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [setRoom, workflow]);

  return {
    ready,
    error,
    roomId,
    roomRowId,
    creating,
    createNewRoom,
    wfState,
    deck,
    guests,
    startGame,
    startQuestion,
    reveal,
    showLeaderboard,
    nextQuestion,
    endGame,
    backToEditor,
    clearSession,
    user,
    login,
    register,
    logout,
    savedDecks,
    refreshDecks,
    saveDeckToCloud,
    deleteDeckFromCloud,
  };
}
