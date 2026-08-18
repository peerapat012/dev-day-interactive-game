import { describe, expect, it, vi } from "vitest";
import {
  buildQuizLeaderboard,
  computeQuizScore,
  createQuizWorkflow,
  type QuizWorkflowPorts,
} from "@/lib/quizWorkflow";
import type {
  QuestionDeck,
  QuizAnswer,
  QuizGuest,
  QuizRoomGameState,
} from "@/types/quiz";

const DECK: QuestionDeck = {
  id: "deck-1",
  name: "General",
  questions: [
    {
      id: "q1",
      prompt: "What is 2 + 2?",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
      ],
      correctOptionId: "b",
      timeLimitMs: 10_000,
    },
    {
      id: "q2",
      prompt: "What is the capital of Thailand?",
      options: [
        { id: "a", text: "Bangkok" },
        { id: "b", text: "Paris" },
      ],
      correctOptionId: "a",
      timeLimitMs: 10_000,
    },
  ],
};

const GUESTS: QuizGuest[] = [
  { guestUuid: "guest-1", displayName: "Alice" },
  { guestUuid: "guest-2", displayName: "Bob" },
];

function makePorts(
  overrides: Partial<QuizWorkflowPorts> = {},
): QuizWorkflowPorts {
  return {
    loadGameState: vi.fn(async () => null),
    persistGameState: vi.fn(async () => undefined),
    listAnswers: vi.fn(async () => []),
    submitAnswer: vi.fn(async (_command, answer) => answer),
    schedule: () => () => undefined,
    ...overrides,
  };
}

interface FakeScheduler {
  schedule: NonNullable<QuizWorkflowPorts["schedule"]>;
  fireAll: () => void;
  pendingCount: () => number;
}

function makeFakeScheduler(): FakeScheduler {
  const timers: { delay: number; cancelled: boolean; fired: boolean }[] = [];
  const callbacks: Map<{ delay: number; cancelled: boolean; fired: boolean }, () => void> =
    new Map();

  const schedule: FakeScheduler["schedule"] = (callback, delay) => {
    const timer = { delay, cancelled: false, fired: false };
    timers.push(timer);
    callbacks.set(timer, callback);
    return () => {
      timer.cancelled = true;
    };
  };

  return {
    schedule,
    fireAll: () => {
      for (const timer of timers) {
        if (!timer.cancelled && !timer.fired) {
          timer.fired = true;
          callbacks.get(timer)?.();
        }
      }
    },
    pendingCount: () =>
      timers.filter((timer) => !timer.cancelled && !timer.fired).length,
  };
}

function answeredAt(startedAtMs: number, elapsedMs: number): string {
  return new Date(startedAtMs + elapsedMs).toISOString();
}

/** Flush pending microtasks + one macrotask so async persist settles. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("computeQuizScore", () => {
  it("awards 1000 for an instant correct answer", () => {
    expect(
      computeQuizScore({
        correctOptionId: "b",
        selectedOptionId: "b",
        questionStartedAtMs: 0,
        answeredAtMs: 0,
        timeLimitMs: 10_000,
      }),
    ).toBe(1000);
  });

  it("scales linearly with elapsed time for correct answers", () => {
    expect(
      computeQuizScore({
        correctOptionId: "b",
        selectedOptionId: "b",
        questionStartedAtMs: 0,
        answeredAtMs: 5_000,
        timeLimitMs: 10_000,
      }),
    ).toBe(500);
  });

  it("scores wrong answers as zero", () => {
    expect(
      computeQuizScore({
        correctOptionId: "b",
        selectedOptionId: "a",
        questionStartedAtMs: 0,
        answeredAtMs: 1_000,
        timeLimitMs: 10_000,
      }),
    ).toBe(0);
  });

  it("scores late answers as zero", () => {
    expect(
      computeQuizScore({
        correctOptionId: "b",
        selectedOptionId: "b",
        questionStartedAtMs: 0,
        answeredAtMs: 11_000,
        timeLimitMs: 10_000,
      }),
    ).toBe(0);
  });
});

describe("quiz workflow phases", () => {
  it("starts in the lobby after starting a game", async () => {
    const workflow = createQuizWorkflow(makePorts());
    await workflow.open("room-1");
    await workflow.startGame(DECK);

    expect(workflow.getState()).toMatchObject({
      roomId: "room-1",
      phase: "lobby",
      deck: DECK,
      currentQuestion: null,
    });
  });

  it("starts a question into the live phase with a host-anchored clock", async () => {
    const now = 1_000_000;
    const workflow = createQuizWorkflow(makePorts({ now: () => now }));
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    expect(workflow.getState()).toMatchObject({
      phase: "live",
      currentQuestionIndex: 0,
      currentQuestion: DECK.questions[0],
      questionStartedAtMs: now,
      remainingMs: 10_000,
    });
  });

  it("moves through reveal and leaderboard, then to the podium after the last question", async () => {
    const workflow = createQuizWorkflow(makePorts());
    await workflow.open("room-1");
    await workflow.startGame(DECK);

    await workflow.startQuestion(0);
    await workflow.reveal();
    expect(workflow.getState().phase).toBe("reveal");

    await workflow.showLeaderboard();
    expect(workflow.getState().phase).toBe("leaderboard");

    await workflow.nextQuestion();
    expect(workflow.getState()).toMatchObject({
      phase: "live",
      currentQuestionIndex: 1,
    });

    await workflow.reveal();
    await workflow.showLeaderboard();
    await workflow.nextQuestion();
    expect(workflow.getState().phase).toBe("podium");
  });

  it("guards illegal transitions", async () => {
    const workflow = createQuizWorkflow(makePorts());
    await workflow.open("room-1");
    await workflow.startGame(DECK);

    await workflow.reveal();
    expect(workflow.getState().phase).toBe("lobby");

    await workflow.startQuestion(0);
    await workflow.showLeaderboard();
    expect(workflow.getState().phase).toBe("live");

    await workflow.nextQuestion();
    expect(workflow.getState().phase).toBe("live");
  });

  it("auto-reveals when a question's time limit elapses", async () => {
    const scheduler = makeFakeScheduler();
    const workflow = createQuizWorkflow(
      makePorts({ schedule: scheduler.schedule }),
    );
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    expect(workflow.getState().phase).toBe("live");

    scheduler.fireAll();
    await flush();
    expect(workflow.getState().phase).toBe("reveal");
  });

  it("auto-advances from reveal to the leaderboard after a dwell", async () => {
    const scheduler = makeFakeScheduler();
    const workflow = createQuizWorkflow(
      makePorts({ schedule: scheduler.schedule }),
    );
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    scheduler.fireAll();
    await flush();
    expect(workflow.getState().phase).toBe("reveal");

    scheduler.fireAll();
    await flush();
    expect(workflow.getState().phase).toBe("leaderboard");
  });

  it("auto-advances through every question to the podium", async () => {
    const scheduler = makeFakeScheduler();
    const workflow = createQuizWorkflow(
      makePorts({ schedule: scheduler.schedule }),
    );
    await workflow.open("room-1");
    await workflow.startGame(DECK);

    for (let index = 0; index < DECK.questions.length; index += 1) {
      if (index === 0) {
        await workflow.startQuestion(0);
      }
      scheduler.fireAll();
      await flush();
      expect(workflow.getState().phase).toBe("reveal");
      scheduler.fireAll();
      await flush();
      expect(workflow.getState().phase).toBe("leaderboard");
      await workflow.nextQuestion();
    }

    expect(workflow.getState().phase).toBe("podium");
  });

  it("cancels the scheduled auto-reveal when the host reveals manually", async () => {
    const scheduler = makeFakeScheduler();
    const workflow = createQuizWorkflow(
      makePorts({ schedule: scheduler.schedule }),
    );
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    await workflow.reveal();
    expect(workflow.getState().phase).toBe("reveal");

    expect(scheduler.pendingCount()).toBe(1);
    scheduler.fireAll();
    await flush();
    expect(workflow.getState().phase).toBe("leaderboard");
  });

  it("returns to the lobby from a live question", async () => {
    const scheduler = makeFakeScheduler();
    const workflow = createQuizWorkflow(
      makePorts({ schedule: scheduler.schedule }),
    );
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    await workflow.returnToLobby();

    expect(workflow.getState()).toMatchObject({
      phase: "lobby",
      currentQuestionIndex: -1,
      currentQuestion: null,
    });
    expect(workflow.getState().deck).toEqual(DECK);
    expect(scheduler.pendingCount()).toBe(0);
  });

  it("rejects starting a question outside the deck", async () => {
    const workflow = createQuizWorkflow(makePorts());
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(9);

    expect(workflow.getState().phase).toBe("lobby");
    expect(workflow.getState().error).toBe("Question not found in the deck");
  });
});

describe("quiz answers and scoring", () => {
  it("records a correct answer with points and live counts", async () => {
    const now = 1_000_000;
    const workflow = createQuizWorkflow(makePorts({ now: () => now }));
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);
    workflow.setSelfGuest("guest-1");

    const accepted = await workflow.submitAnswer({
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "b",
      answeredAt: answeredAt(now, 1_000),
    });

    expect(accepted).toBe(true);
    expect(workflow.getState()).toMatchObject({
      answerCounts: { b: 1 },
      answeredCount: 1,
      myAnswer: {
        questionId: "q1",
        isCorrect: true,
        points: 900,
      },
    });
  });

  it("allows only one answer per guest per question", async () => {
    const now = 1_000_000;
    const workflow = createQuizWorkflow(makePorts({ now: () => now }));
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    await workflow.submitAnswer({
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "b",
      answeredAt: answeredAt(now, 1_000),
    });
    const second = await workflow.submitAnswer({
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "a",
      answeredAt: answeredAt(now, 2_000),
    });

    expect(second).toBe(false);
    expect(workflow.getState()).toMatchObject({ answeredCount: 1 });
  });

  it("rejects answers after the question has ended", async () => {
    const workflow = createQuizWorkflow(makePorts());
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);
    await workflow.reveal();

    const accepted = await workflow.submitAnswer({
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "b",
      answeredAt: new Date().toISOString(),
    });

    expect(accepted).toBe(false);
  });

  it("accepts a late answer within the live phase but scores it zero", async () => {
    const now = 1_000_000;
    const workflow = createQuizWorkflow(makePorts({ now: () => now }));
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);
    workflow.setSelfGuest("guest-1");

    const accepted = await workflow.submitAnswer({
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "b",
      answeredAt: answeredAt(now, 15_000),
    });

    expect(accepted).toBe(true);
    expect(workflow.getState()).toMatchObject({
      myAnswer: { isCorrect: true, points: 0 },
    });
  });
});

describe("quiz leaderboard", () => {
  it("builds a leaderboard from answers and guests, top five plus full list", () => {
    const answers: QuizAnswer[] = [
      {
        roomId: "room-1",
        questionId: "q1",
        guestId: "row-1",
        guestUuid: "guest-1",
        selectedOptionId: "b",
        answeredAt: "0",
        isCorrect: true,
        points: 900,
      },
      {
        roomId: "room-1",
        questionId: "q1",
        guestId: "row-2",
        guestUuid: "guest-2",
        selectedOptionId: "a",
        answeredAt: "0",
        isCorrect: false,
        points: 0,
      },
    ];

    const leaderboard = buildQuizLeaderboard(answers, GUESTS);

    expect(leaderboard).toEqual([
      {
        rank: 1,
        guestUuid: "guest-1",
        displayName: "Alice",
        score: 900,
        correct: 1,
      },
      {
        rank: 2,
        guestUuid: "guest-2",
        displayName: "Bob",
        score: 0,
        correct: 0,
      },
    ]);
  });

  it("accumulates scores across questions into the podium", async () => {
    const now = 1_000_000;
    const workflow = createQuizWorkflow(makePorts({ now: () => now }));
    await workflow.open("room-1");
    workflow.setGuests(GUESTS);
    await workflow.startGame(DECK);

    await workflow.startQuestion(0);
    await workflow.submitAnswer({
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "b",
      answeredAt: answeredAt(now, 1_000),
    });
    await workflow.submitAnswer({
      guestId: "row-2",
      guestUuid: "guest-2",
      selectedOptionId: "a",
      answeredAt: answeredAt(now, 1_000),
    });
    await workflow.reveal();
    await workflow.showLeaderboard();

    await workflow.nextQuestion();
    await workflow.submitAnswer({
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "a",
      answeredAt: answeredAt(now, 1_000),
    });
    await workflow.submitAnswer({
      guestId: "row-2",
      guestUuid: "guest-2",
      selectedOptionId: "a",
      answeredAt: answeredAt(now, 1_000),
    });
    await workflow.reveal();
    await workflow.showLeaderboard();
    await workflow.nextQuestion();

    expect(workflow.getState().phase).toBe("podium");
    expect(workflow.getState().leaderboard).toEqual([
      {
        rank: 1,
        guestUuid: "guest-1",
        displayName: "Alice",
        score: 1800,
        correct: 2,
      },
      {
        rank: 2,
        guestUuid: "guest-2",
        displayName: "Bob",
        score: 900,
        correct: 1,
      },
    ]);
  });

  it("ingests remote answers for the host without double counting", async () => {
    const now = 1_000_000;
    const workflow = createQuizWorkflow(makePorts({ now: () => now }));
    await workflow.open("room-1");
    workflow.setGuests(GUESTS);
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    const answer: QuizAnswer = {
      roomId: "room-1",
      questionId: "q1",
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "b",
      answeredAt: answeredAt(now, 1_000),
      isCorrect: true,
      points: 900,
    };
    workflow.applyRemoteAnswer(answer);
    workflow.applyRemoteAnswer(answer);

    expect(workflow.getState()).toMatchObject({
      answerCounts: { b: 1 },
      answeredCount: 1,
    });
  });
});

describe("quiz persistence and session", () => {
  it("restores the phase and answers on open", async () => {
    const persisted: QuizRoomGameState = {
      phase: "leaderboard",
      currentQuestionIndex: 0,
      currentQuestion: DECK.questions[0],
      questionStartedAtMs: 1_000_000,
    };
    const existingAnswers: QuizAnswer[] = [
      {
        roomId: "room-1",
        questionId: "q1",
        guestId: "row-1",
        guestUuid: "guest-1",
        selectedOptionId: "b",
        answeredAt: "0",
        isCorrect: true,
        points: 900,
      },
    ];
    const ports = makePorts({
      loadGameState: vi.fn(async () => persisted),
      listAnswers: vi.fn(async () => existingAnswers),
    });
    const workflow = createQuizWorkflow(ports);

    await workflow.open("room-1");
    workflow.setGuests(GUESTS);

    expect(workflow.getState()).toMatchObject({
      phase: "leaderboard",
      currentQuestionIndex: 0,
    });
    expect(workflow.getState().leaderboard[0]).toMatchObject({
      displayName: "Alice",
      score: 900,
    });
  });

  it("persists each host transition as game state", async () => {
    const persistGameState = vi.fn(async () => undefined);
    const workflow = createQuizWorkflow(makePorts({ persistGameState }));
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    expect(persistGameState).toHaveBeenLastCalledWith(
      "room-1",
      expect.objectContaining({ phase: "live", currentQuestionIndex: 0 }),
    );
  });

  it("clears the session back to a blank lobby", async () => {
    const workflow = createQuizWorkflow(makePorts());
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);

    workflow.clearSession();

    expect(workflow.getState()).toEqual(
      expect.objectContaining({
        phase: "lobby",
        deck: null,
        currentQuestion: null,
      }),
    );
    expect(workflow.getState().roomId).toBe("");
  });

  it("resets to a blank lobby in the same room when done on the podium", async () => {
    const workflow = createQuizWorkflow(makePorts());
    await workflow.open("room-1");
    workflow.setGuests(GUESTS);
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);
    await workflow.reveal();
    await workflow.showLeaderboard();
    await workflow.endGame();

    expect(workflow.getState().phase).toBe("podium");

    await workflow.endGame();

    expect(workflow.getState()).toEqual(
      expect.objectContaining({
        phase: "lobby",
        deck: null,
        currentQuestion: null,
        currentQuestionIndex: -1,
      }),
    );
    expect(workflow.getState().roomId).toBe("room-1");
  });

  it("persists the reset so a reload after Done lands on a fresh lobby, not the podium", async () => {
    let persisted: QuizRoomGameState | null = null;
    const ports = makePorts({
      loadGameState: vi.fn(async () => persisted),
      persistGameState: vi.fn(async (_roomId, state) => {
        persisted = state;
      }),
    });
    const workflow = createQuizWorkflow(ports);
    await workflow.open("room-1");
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);
    await workflow.reveal();
    await workflow.showLeaderboard();
    await workflow.endGame();
    await workflow.endGame();

    expect(workflow.getState().phase).toBe("lobby");

    const reloaded = createQuizWorkflow(ports);
    await reloaded.open("room-1");
    expect(reloaded.getState().phase).toBe("lobby");
  });

  it("does not carry a finished quiz's answers into a second quiz in the same room", async () => {
    const answerRows: QuizAnswer[] = [];
    const ports = makePorts({
      listAnswers: vi.fn(async () => answerRows),
      submitAnswer: vi.fn(async (_command, answer) => {
        answerRows.push(answer);
        return answer;
      }),
      clearAnswers: vi.fn(async (roomId: string) => {
        for (let index = answerRows.length - 1; index >= 0; index -= 1) {
          if (answerRows[index].roomId === roomId) answerRows.splice(index, 1);
        }
      }),
    });

    const workflow = createQuizWorkflow(ports);
    await workflow.open("room-1");
    workflow.setGuests(GUESTS);
    await workflow.startGame(DECK);
    await workflow.startQuestion(0);
    await workflow.submitAnswer({
      guestId: "row-1",
      guestUuid: "guest-1",
      selectedOptionId: "b",
      answeredAt: answeredAt(1_000_000, 1_000),
    });
    await workflow.reveal();
    await workflow.showLeaderboard();
    await workflow.endGame();
    await workflow.endGame();
    expect(workflow.getState().phase).toBe("lobby");

    const reloaded = createQuizWorkflow(ports);
    await reloaded.open("room-1");
    reloaded.setGuests(GUESTS);
    await reloaded.startGame(DECK);
    await reloaded.startQuestion(0);

    expect(reloaded.getState()).toMatchObject({
      phase: "live",
      answerCounts: {},
      answeredCount: 0,
      leaderboard: [],
    });
  });

  it("reschedules the auto-reveal timer when reopening a persisted live question", async () => {
    const persisted: QuizRoomGameState = {
      phase: "live",
      currentQuestionIndex: 0,
      currentQuestion: DECK.questions[0],
      questionStartedAtMs: 1_000_000,
    };
    const scheduler = makeFakeScheduler();
    const workflow = createQuizWorkflow(
      makePorts({
        loadGameState: vi.fn(async () => persisted),
        schedule: scheduler.schedule,
      }),
    );
    await workflow.open("room-1");

    expect(workflow.getState().phase).toBe("live");

    scheduler.fireAll();
    await flush();

    expect(workflow.getState().phase).toBe("reveal");
  });
});