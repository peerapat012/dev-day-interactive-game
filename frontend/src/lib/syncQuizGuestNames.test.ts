import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQuizWorkflow } from "@/lib/quizWorkflow";
import { QUIZ_GUEST_NAMES_REFRESH_MS, syncQuizGuestNames } from "@/lib/syncQuizGuestNames";
import type { QuizGuest, QuizPhase } from "@/types/quiz";

const guests = [
  { guestUuid: "player-1", displayName: "Alice" },
  { guestUuid: "player-2", displayName: "Bob" },
];

async function openWorkflow() {
  const workflow = createQuizWorkflow({
    loadGameState: async () => null,
    persistGameState: async () => undefined,
    listAnswers: async () => guests.map((guest, index) => ({
      roomId: "room", questionId: "question", guestUuid: guest.guestUuid,
      // Appwrite account IDs differ from the in-room player UUIDs.
      guestId: `anonymous-account-${index}`, selectedOptionId: "option",
      answeredAt: "2026-09-08T00:00:00.000Z", isCorrect: true, points: 100 - index,
    })),
    submitAnswer: async (_command, answer) => answer,
  });
  await workflow.open("room");
  return workflow;
}

const remotePhase = (phase: QuizPhase) => ({
  phase, currentQuestionIndex: 0, currentQuestion: null, questionStartedAtMs: null,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("guest quiz leaderboard names", () => {
  it("loads names after opening, including anonymous players' own names", async () => {
    const workflow = await openWorkflow();
    const stop = syncQuizGuestNames(workflow, async () => guests, vi.fn());
    await vi.advanceTimersByTimeAsync(0);
    expect(workflow.getState().topLeaderboard.map((entry) => entry.displayName)).toEqual(["Alice", "Bob"]);
    stop();
  });

  it("refreshes late joiners when the host shows leaderboard and podium", async () => {
    const workflow = await openWorkflow();
    const load = vi.fn().mockResolvedValueOnce([guests[0]]).mockResolvedValue(guests);
    const stop = syncQuizGuestNames(workflow, load, vi.fn());
    await vi.advanceTimersByTimeAsync(0);
    expect(workflow.getState().topLeaderboard[1].displayName).toBe("Guest");
    await workflow.applyRemoteGameState(remotePhase("leaderboard"));
    await vi.advanceTimersByTimeAsync(0);
    expect(workflow.getState().topLeaderboard[1].displayName).toBe("Bob");
    await workflow.applyRemoteGameState(remotePhase("podium"));
    await vi.advanceTimersByTimeAsync(0);
    expect(load).toHaveBeenCalledTimes(3);
    expect(workflow.getState().topLeaderboard.map((entry) => entry.score)).toEqual([100, 99]);
    stop();
  });

  it("retries a failed initial load and preserves names on subsequent failures", async () => {
    const workflow = await openWorkflow();
    const error = new Error("temporary failure");
    const load = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(guests).mockRejectedValue(error);
    const onError = vi.fn();
    const stop = syncQuizGuestNames(workflow, load, onError);
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledWith(error);
    await vi.advanceTimersByTimeAsync(QUIZ_GUEST_NAMES_REFRESH_MS);
    expect(workflow.getState().topLeaderboard[1].displayName).toBe("Bob");
    await vi.advanceTimersByTimeAsync(QUIZ_GUEST_NAMES_REFRESH_MS);
    expect(workflow.getState().topLeaderboard[1].displayName).toBe("Bob");
    stop();
  });

  it("does not overlap loads or apply pending results after leaving the room", async () => {
    const workflow = await openWorkflow();
    let resolve!: (value: QuizGuest[]) => void;
    const load = vi.fn(() => new Promise<QuizGuest[]>((done) => { resolve = done; }));
    const stop = syncQuizGuestNames(workflow, load, vi.fn());
    await vi.advanceTimersByTimeAsync(QUIZ_GUEST_NAMES_REFRESH_MS * 2);
    await workflow.applyRemoteGameState(remotePhase("leaderboard"));
    expect(load).toHaveBeenCalledTimes(1);
    stop();
    workflow.clearSession();
    resolve(guests);
    await vi.advanceTimersByTimeAsync(QUIZ_GUEST_NAMES_REFRESH_MS);
    expect(workflow.getState().topLeaderboard).toEqual([]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
