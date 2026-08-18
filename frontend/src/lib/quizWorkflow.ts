import type {
  QuestionDeck,
  QuizAnswer,
  QuizGuest,
  QuizLeaderboardEntry,
  QuizPhase,
  QuizQuestion,
  QuizRoomGameState,
} from "@/types/quiz";

export interface SubmitAnswerCommand {
  roomId: string;
  questionId: string;
  guestId: string;
  guestUuid: string;
  selectedOptionId: string;
  answeredAt: string;
  /** Adapters must check this before each external write. */
  isCurrent: () => boolean;
}

export interface QuizWorkflowPorts {
  now?: () => number;
  loadGameState: (roomId: string) => Promise<QuizRoomGameState | null>;
  persistGameState: (roomId: string, state: QuizRoomGameState) => Promise<void>;
  listAnswers: (roomId: string) => Promise<QuizAnswer[]>;
  /** Persist one answer per question; returns null when rejected. */
  submitAnswer: (
    command: SubmitAnswerCommand,
    answer: QuizAnswer,
  ) => Promise<QuizAnswer | null>;
  /** Delete all persisted answers for a room (fresh quiz in the same room). */
  clearAnswers?: (roomId: string) => Promise<void>;
  /** Schedule a one-off callback after a delay; returns a cancel function. */
  schedule?: (callback: () => void, delayMs: number) => () => void;
}

export interface QuizWorkflowState {
  roomId: string;
  phase: QuizPhase;
  deck: QuestionDeck | null;
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion | null;
  questionStartedAtMs: number | null;
  remainingMs: number;
  answerCounts: Record<string, number>;
  answeredCount: number;
  leaderboard: QuizLeaderboardEntry[];
  topLeaderboard: QuizLeaderboardEntry[];
  myAnswer: QuizAnswer | null;
  busy: boolean;
  error: string | null;
}

type Listener = (state: QuizWorkflowState) => void;

const EMPTY_STATE: QuizWorkflowState = {
  roomId: "",
  phase: "lobby",
  deck: null,
  currentQuestionIndex: -1,
  currentQuestion: null,
  questionStartedAtMs: null,
  remainingMs: 0,
  answerCounts: {},
  answeredCount: 0,
  leaderboard: [],
  topLeaderboard: [],
  myAnswer: null,
  busy: false,
  error: null,
};

export const TOP_LEADERBOARD_COUNT = 5;

/** How long the revealed answer stays on screen before the leaderboard appears. */
export const AUTO_LEADERBOARD_DELAY_MS = 4000;

function defaultSchedule(callback: () => void, delayMs: number): () => void {
  const id = setTimeout(callback, delayMs);
  return () => clearTimeout(id);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export interface QuizScoreInput {
  correctOptionId: string;
  selectedOptionId: string;
  questionStartedAtMs: number;
  answeredAtMs: number;
  timeLimitMs: number;
}

/** Standard Kahoot scoring: correct answers only; wrong or late answers score 0. */
export function computeQuizScore(input: QuizScoreInput): number {
  if (input.selectedOptionId !== input.correctOptionId) return 0;
  const elapsedMs = input.answeredAtMs - input.questionStartedAtMs;
  if (elapsedMs < 0 || elapsedMs > input.timeLimitMs) return 0;
  return Math.round(1000 * (1 - elapsedMs / input.timeLimitMs));
}

export function buildQuizLeaderboard(
  answers: QuizAnswer[],
  guests: QuizGuest[],
): QuizLeaderboardEntry[] {
  const byGuest = new Map<string, { score: number; correct: number; name: string }>();
  const names = new Map(guests.map((guest) => [guest.guestUuid, guest.displayName]));

  for (const answer of answers) {
    const entry = byGuest.get(answer.guestUuid) ?? {
      score: 0,
      correct: 0,
      name: names.get(answer.guestUuid) ?? "Guest",
    };
    entry.score += answer.points;
    if (answer.isCorrect) entry.correct += 1;
    byGuest.set(answer.guestUuid, entry);
  }

  return [...byGuest.entries()]
    .map(([guestUuid, entry]) => ({
      rank: 0,
      guestUuid,
      displayName: entry.name,
      score: entry.score,
      correct: entry.correct,
    }))
    .sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function answerCountsFor(answers: QuizAnswer[], questionId: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const answer of answers) {
    if (answer.questionId !== questionId) continue;
    counts[answer.selectedOptionId] = (counts[answer.selectedOptionId] ?? 0) + 1;
  }
  return counts;
}

export function createQuizWorkflow(ports: QuizWorkflowPorts) {
  let state = { ...EMPTY_STATE };
  let guests: QuizGuest[] = [];
  let answers: QuizAnswer[] = [];
  let selfGuestUuid = "";
  let startedAtMs: number | null = null;
  let pendingTimer: (() => void) | null = null;
  const listeners = new Set<Listener>();

  function now(): number {
    return ports.now?.() ?? Date.now();
  }

  function cancelPending() {
    pendingTimer?.();
    pendingTimer = null;
  }

  function schedule(delayMs: number, callback: () => void) {
    cancelPending();
    pendingTimer = (ports.schedule ?? defaultSchedule)(() => {
      pendingTimer = null;
      callback();
    }, delayMs);
  }

  function emit(next: Partial<QuizWorkflowState>) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener(state));
  }

  function remainingMsFor(startedAt: number | null): number {
    if (state.phase !== "live" || !state.currentQuestion || startedAt === null) {
      return 0;
    }
    return Math.max(0, startedAt + state.currentQuestion.timeLimitMs - now());
  }

  function rebuild() {
    const questionId = state.currentQuestion?.id ?? "";
    const leaderboard = buildQuizLeaderboard(answers, guests);
    emit({
      remainingMs: remainingMsFor(startedAtMs),
      answerCounts: questionId ? answerCountsFor(answers, questionId) : {},
      answeredCount: questionId
        ? answers.filter((answer) => answer.questionId === questionId).length
        : 0,
      leaderboard,
      topLeaderboard: leaderboard.slice(0, TOP_LEADERBOARD_COUNT),
      myAnswer: selfGuestUuid
        ? (answers.find(
            (answer) =>
              answer.guestUuid === selfGuestUuid &&
              answer.questionId === questionId,
          ) ?? null)
        : null,
    });
  }

  function gameState(): QuizRoomGameState {
    return {
      phase: state.phase,
      currentQuestionIndex: state.currentQuestionIndex,
      currentQuestion: state.currentQuestion,
      questionStartedAtMs: startedAtMs,
    };
  }

  async function transition(
    next: Omit<QuizRoomGameState, "phase" | "currentQuestionIndex"> & {
      phase: QuizPhase;
      currentQuestionIndex: number;
    },
  ) {
    cancelPending();
    startedAtMs = next.questionStartedAtMs;
    emit({
      phase: next.phase,
      currentQuestionIndex: next.currentQuestionIndex,
      currentQuestion: next.currentQuestion,
      questionStartedAtMs: next.questionStartedAtMs,
      error: null,
    });
    rebuild();
    try {
      await ports.persistGameState(state.roomId, gameState());
    } catch (error) {
      emit({ error: errorMessage(error, "Could not persist game state") });
    }
  }

  function answerKey(questionId: string, guestUuid: string): string {
    return `${questionId}:${guestUuid}`;
  }

  function applyAnswer(answer: QuizAnswer) {
    const key = answerKey(answer.questionId, answer.guestUuid);
    const existing = answers.findIndex(
      (item) => answerKey(item.questionId, item.guestUuid) === key,
    );
    if (existing >= 0) {
      answers = answers.map((item, index) =>
        index === existing ? answer : item,
      );
    } else {
      answers = [...answers, answer];
    }
    rebuild();
  }

  async function startQuestion(index: number) {
    const deck = state.deck;
    if (!deck) {
      emit({ error: "Start a game before running questions" });
      return;
    }
    const question = deck.questions[index];
    if (!question) {
      emit({ error: "Question not found in the deck" });
      return;
    }
    startedAtMs = now();
    await transition({
      phase: "live",
      currentQuestionIndex: index,
      currentQuestion: question,
      questionStartedAtMs: startedAtMs,
    });
    schedule(question.timeLimitMs, () => {
      void reveal();
    });
  }

  async function reveal() {
    if (state.phase !== "live") return;
    await transition({
      phase: "reveal",
      currentQuestionIndex: state.currentQuestionIndex,
      currentQuestion: state.currentQuestion,
      questionStartedAtMs: startedAtMs,
    });
    schedule(AUTO_LEADERBOARD_DELAY_MS, () => {
      void showLeaderboard();
    });
  }

  async function showLeaderboard() {
    if (state.phase !== "reveal") return;
    await transition({
      phase: "leaderboard",
      currentQuestionIndex: state.currentQuestionIndex,
      currentQuestion: state.currentQuestion,
      questionStartedAtMs: startedAtMs,
    });
  }

  async function returnToLobby() {
    if (state.phase === "lobby") return;
    await transition({
      phase: "lobby",
      currentQuestionIndex: -1,
      currentQuestion: null,
      questionStartedAtMs: null,
    });
  }

  async function nextQuestion() {
    if (state.phase !== "leaderboard") return;
    const nextIndex = state.currentQuestionIndex + 1;
    const nextQuestion = state.deck?.questions[nextIndex];
    if (nextQuestion) {
      startedAtMs = now();
      await transition({
        phase: "live",
        currentQuestionIndex: nextIndex,
        currentQuestion: nextQuestion,
        questionStartedAtMs: startedAtMs,
      });
      schedule(nextQuestion.timeLimitMs, () => {
        void reveal();
      });
    } else {
      await transition({
        phase: "podium",
        currentQuestionIndex: state.currentQuestionIndex,
        currentQuestion: state.currentQuestion,
        questionStartedAtMs: startedAtMs,
      });
    }
  }

  async function endGame() {
    if (state.phase !== "podium") {
      await transition({
        phase: "podium",
        currentQuestionIndex: state.currentQuestionIndex,
        currentQuestion: state.currentQuestion,
        questionStartedAtMs: startedAtMs,
      });
      return;
    }

    // "Done" on the final podium: reset to a fresh lobby in the same room so
    // the host can build and run another quiz.
    cancelPending();
    const roomId = state.roomId;
    guests = [];
    answers = [];
    selfGuestUuid = "";
    startedAtMs = null;
    state = { ...EMPTY_STATE, roomId };
    emit({});
    if (ports.clearAnswers) {
      try {
        await ports.clearAnswers(roomId);
      } catch (error) {
        emit({ error: errorMessage(error, "Could not clear quiz answers") });
      }
    }
    try {
      await ports.persistGameState(roomId, gameState());
    } catch (error) {
      emit({ error: errorMessage(error, "Could not persist reset") });
    }
  }

  return {
    getState: () => state,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async open(roomId: string) {
      roomId = roomId.trim();
      cancelPending();
      guests = [];
      answers = [];
      selfGuestUuid = "";
      startedAtMs = null;
      state = { ...EMPTY_STATE, roomId };
      emit({ roomId });

      let persisted: QuizRoomGameState | null = null;
      try {
        persisted = await ports.loadGameState(roomId);
      } catch (error) {
        emit({ error: errorMessage(error, "Could not load quiz game") });
        return;
      }
      if (persisted) {
        startedAtMs = persisted.questionStartedAtMs;
        emit({
          phase: persisted.phase,
          currentQuestionIndex: persisted.currentQuestionIndex,
          currentQuestion: persisted.currentQuestion,
          questionStartedAtMs: persisted.questionStartedAtMs,
          error: null,
        });
        if (
          persisted.phase === "live" &&
          persisted.currentQuestion &&
          persisted.questionStartedAtMs !== null
        ) {
          const elapsedMs = now() - persisted.questionStartedAtMs;
          const remainingMs = Math.max(
            0,
            persisted.currentQuestion.timeLimitMs - elapsedMs,
          );
          schedule(remainingMs, () => {
            void reveal();
          });
        } else if (persisted.phase === "reveal") {
          schedule(AUTO_LEADERBOARD_DELAY_MS, () => {
            void showLeaderboard();
          });
        }
      }

      try {
        answers = await ports.listAnswers(roomId);
      } catch (error) {
        emit({ error: errorMessage(error, "Could not load quiz answers") });
      }
      rebuild();
    },

    setGuests(nextGuests: QuizGuest[]) {
      guests = nextGuests;
      rebuild();
    },

    setSelfGuest(guestUuid: string) {
      selfGuestUuid = guestUuid;
      rebuild();
    },

    async startGame(deck: QuestionDeck) {
      state = { ...state, deck, error: null };
      await transition({
        phase: "lobby",
        currentQuestionIndex: -1,
        currentQuestion: null,
        questionStartedAtMs: null,
      });
    },

    startQuestion,
    reveal,
    showLeaderboard,
    returnToLobby,
    nextQuestion,
    endGame,

    /** Guest-side ingest of the host's broadcast game state (realtime rooms channel). */
    async applyRemoteGameState(nextState: QuizRoomGameState) {
      startedAtMs = nextState.questionStartedAtMs;
      emit({
        phase: nextState.phase,
        currentQuestionIndex: nextState.currentQuestionIndex,
        currentQuestion: nextState.currentQuestion,
        questionStartedAtMs: nextState.questionStartedAtMs,
        error: null,
      });
      rebuild();
    },

    async submitAnswer(input: {
      guestId: string;
      guestUuid: string;
      selectedOptionId: string;
      answeredAt: string;
    }): Promise<boolean> {
      const question = state.currentQuestion;
      if (state.phase !== "live" || !question || startedAtMs === null) {
        return false;
      }
      const key = answerKey(question.id, input.guestUuid);
      if (answers.some((answer) => answerKey(answer.questionId, answer.guestUuid) === key)) {
        return false;
      }

      const answeredAtMs = new Date(input.answeredAt).getTime();
      const isCorrect = input.selectedOptionId === question.correctOptionId;
      const points = computeQuizScore({
        correctOptionId: question.correctOptionId,
        selectedOptionId: input.selectedOptionId,
        questionStartedAtMs: startedAtMs,
        answeredAtMs,
        timeLimitMs: question.timeLimitMs,
      });

      const answer: QuizAnswer = {
        roomId: state.roomId,
        questionId: question.id,
        guestId: input.guestId,
        guestUuid: input.guestUuid,
        selectedOptionId: input.selectedOptionId,
        answeredAt: input.answeredAt,
        isCorrect,
        points,
      };

      let persisted: QuizAnswer | null = null;
      try {
        persisted = await ports.submitAnswer(
          {
            roomId: state.roomId,
            questionId: question.id,
            guestId: input.guestId,
            guestUuid: input.guestUuid,
            selectedOptionId: input.selectedOptionId,
            answeredAt: input.answeredAt,
            isCurrent: () => true,
          },
          answer,
        );
      } catch (error) {
        emit({ error: errorMessage(error, "Could not submit answer") });
        return false;
      }

      if (!persisted) return false;
      applyAnswer(persisted);
      return true;
    },

    applyRemoteAnswer(answer: QuizAnswer) {
      applyAnswer(answer);
    },

    clearSession() {
      cancelPending();
      guests = [];
      answers = [];
      selfGuestUuid = "";
      startedAtMs = null;
      state = { ...EMPTY_STATE };
      emit({});
    },
  };
}

export type QuizWorkflow = ReturnType<typeof createQuizWorkflow>;