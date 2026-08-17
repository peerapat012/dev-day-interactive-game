"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { HostLeaderboard } from "@/features/quiz/components/HostLeaderboard";
import { LiveChart } from "@/features/quiz/components/LiveChart";
import { Podium } from "@/features/quiz/components/Podium";
import { optionColorAt } from "@/features/quiz/components/quizOptionStyles";
import { useQuizCountdown } from "@/features/quiz/hooks/useQuizCountdown";
import { AUTO_LEADERBOARD_DELAY_MS } from "@/lib/quizWorkflow";
import { buildGuestJoinUrl } from "@/lib/guestJoinUrl";
import type { QuizWorkflowState } from "@/lib/quizWorkflow";
import { Button } from "@/shared/ui/Button";
import type { QuizGuest, QuizQuestion } from "@/types/quiz";

interface HostGameControlProps {
  roomId: string;
  state: QuizWorkflowState;
  guests: QuizGuest[];
  onStartQuestion: (index: number) => void;
  onReveal: () => void;
  onShowLeaderboard: () => void;
  onNextQuestion: () => void;
  onEndGame: () => void;
  onCreateNewRoom: () => Promise<string>;
  creating: boolean;
}

export function HostGameControl({
  roomId,
  state,
  guests,
  onStartQuestion,
  onReveal,
  onShowLeaderboard,
  onNextQuestion,
  onEndGame,
  onCreateNewRoom,
  creating,
}: HostGameControlProps) {
  const { phase, deck, currentQuestion, currentQuestionIndex, answerCounts } =
    state;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AnimatePresence initial={false} mode="wait">
        {phase === "lobby" ? (
          <LobbyView
            key="lobby"
            roomId={roomId}
            deck={deck}
            guests={guests}
            onStartQuestion={onStartQuestion}
            onCreateNewRoom={onCreateNewRoom}
            creating={creating}
          />
        ) : phase === "live" ? (          <LiveView
            key="live"
            question={currentQuestion}
            index={currentQuestionIndex}
            startedAtMs={state.questionStartedAtMs}
            answerCounts={answerCounts}
            onReveal={onReveal}
          />
        ) : phase === "reveal" ? (
          <RevealView
            key="reveal"
            question={currentQuestion}
            answerCounts={answerCounts}
            onShowLeaderboard={onShowLeaderboard}
          />
        ) : phase === "leaderboard" ? (
          <LeaderboardView
            key="leaderboard"
            state={state}
            onNextQuestion={onNextQuestion}
            onEndGame={onEndGame}
          />
        ) : phase === "podium" ? (
          <PodiumView key="podium" state={state} onEndGame={onEndGame} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function LobbyView({
  roomId,
  deck,
  guests,
  onStartQuestion,
  onCreateNewRoom,
  creating,
}: {
  roomId: string;
  deck: QuizWorkflowState["deck"];
  guests: QuizGuest[];
  onStartQuestion: (index: number) => void;
  onCreateNewRoom: () => Promise<string>;
  creating: boolean;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const guestUrl = useMemo(() => buildGuestJoinUrl(roomId), [roomId]);
  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(guestUrl)}`,
    [guestUrl],
  );

  async function copy(text: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      setter(false);
    }
  }

  const questions = deck?.questions ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Scan to join
        </p>
        <div className="mt-4 rounded-2xl bg-white p-3 shadow-lg shadow-violet-950/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt={`QR code for room ${roomId}`}
            width={280}
            height={280}
            className="h-auto w-[min(280px,60vw)]"
          />
        </div>
        <p className="mt-5 text-xs text-zinc-500">Room ID</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-violet-300">
          {roomId}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void copy(roomId, setCopiedCode)}
          >
            {copiedCode ? "Code copied!" : "Copy room ID"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void copy(guestUrl, setCopiedLink)}
          >
            {copiedLink ? "Link copied!" : "Copy guest link"}
          </Button>
        </div>
        <p className="mt-4 text-sm tabular-nums text-zinc-400">
          {guests.length} {guests.length === 1 ? "guest" : "guests"} joined
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-200">
            {deck?.name ?? "Ready to play"}
          </p>
          <span className="text-xs tabular-nums text-zinc-500">
            {questions.length} questions
          </span>
        </div>
        <Button
          type="button"
          onClick={() => onStartQuestion(0)}
          disabled={!questions.length}
          className="w-full"
        >
          Start first question
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Up next
        </p>
        {questions.length === 0 ? (
          <p className="text-sm text-zinc-500">No questions in this deck.</p>
        ) : (
          questions.map((question, index) => (
            <div
              key={question.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-3"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500/20 text-xs font-bold tabular-nums text-violet-300">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                {question.prompt}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                {question.timeLimitMs / 1000}s
              </span>
            </div>
          ))
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => void onCreateNewRoom()}
        disabled={creating}
        className="w-full"
      >
        {creating ? "Creating…" : "Create new room"}
      </Button>
    </div>
  );
}

function LiveView({
  question,
  index,
  startedAtMs,
  answerCounts,
  onReveal,
}: {
  question: QuizQuestion | null;
  index: number;
  startedAtMs: number | null;
  answerCounts: Record<string, number>;
  onReveal: () => void;
}) {
  const remainingMs = useQuizCountdown({
    active: true,
    startedAtMs,
    timeLimitMs: question?.timeLimitMs ?? 0,
    onExpire: () => undefined,
  });

  const seconds = Math.ceil(remainingMs / 1000);

  if (!question) return null;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Question {index + 1}
        </p>
        <h2 className="text-2xl font-bold leading-snug text-balance text-zinc-50 sm:text-3xl">
          {question.prompt}
        </h2>
        <p className="text-sm tabular-nums text-zinc-500">
          {seconds} {seconds === 1 ? "second" : "seconds"} left — auto-reveals at 0
        </p>
      </div>
      <LiveChart question={question} answerCounts={answerCounts} />
      <Button type="button" onClick={onReveal} className="w-full">
        Reveal answers now
      </Button>
    </div>
  );
}

function RevealView({
  question,
  answerCounts,
  onShowLeaderboard,
}: {
  question: QuizQuestion | null;
  answerCounts: Record<string, number>;
  onShowLeaderboard: () => void;
}) {
  if (!question) return null;
  const correctIndex = question.options.findIndex(
    (option) => option.id === question.correctOptionId,
  );
  const correctText =
    correctIndex >= 0 ? question.options[correctIndex].text : "";
  const correctColor =
    correctIndex >= 0 ? optionColorAt(correctIndex).bar : "bg-emerald-500";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Answers revealed
        </p>
        <h2 className="text-2xl font-bold leading-snug text-balance text-zinc-50 sm:text-3xl">
          {question.prompt}
        </h2>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-zinc-950 ${correctColor}`}>
            ✓
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-200">
            {correctText}
          </p>
        </div>
      </div>
      <LiveChart question={question} answerCounts={answerCounts} reveal />
      <p className="text-center text-xs tabular-nums text-zinc-500">
        Auto-advances to the leaderboard in {AUTO_LEADERBOARD_DELAY_MS / 1000}s.
      </p>
      <Button type="button" onClick={onShowLeaderboard} className="w-full">
        Show leaderboard now
      </Button>
    </div>
  );
}

function LeaderboardView({
  state,
  onNextQuestion,
  onEndGame,
}: {
  state: QuizWorkflowState;
  onNextQuestion: () => void;
  onEndGame: () => void;
}) {
  const { topLeaderboard, leaderboard, deck, currentQuestionIndex } = state;
  const hasNext = (deck?.questions.length ?? 0) > currentQuestionIndex + 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Top {topLeaderboard.length}
        </p>
        <h2 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
          Leaderboard
        </h2>
      </div>
      <HostLeaderboard entries={topLeaderboard} />
      <div className="flex flex-col gap-3">
        {hasNext ? (
          <Button type="button" onClick={onNextQuestion} className="w-full">
            Next question
          </Button>
        ) : (
          <Button type="button" onClick={onEndGame} className="w-full">
            End quiz
          </Button>
        )}
        {leaderboard.length > topLeaderboard.length ? (
          <p className="text-center text-xs tabular-nums text-zinc-500">
            {leaderboard.length} guests in this room
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PodiumView({
  state,
  onEndGame,
}: {
  state: QuizWorkflowState;
  onEndGame: () => void;
}) {
  const topThree = state.topLeaderboard.slice(0, 3);

  useEffect(() => {
    document.title = "Quiz complete — Word Cloud Game";
    return () => {
      document.title = "Word Cloud Game";
    };
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Quiz complete
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-50">
          Final podium
        </h2>
      </div>
      <Podium topThree={topThree} />
      <Button type="button" onClick={onEndGame} className="w-full">
        Done
      </Button>
    </div>
  );
}