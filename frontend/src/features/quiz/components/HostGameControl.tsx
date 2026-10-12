"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { HostLeaderboard } from "@/features/quiz/components/HostLeaderboard";
import { LiveChart } from "@/features/quiz/components/LiveChart";
import { Podium } from "@/features/quiz/components/Podium";
import { optionColorAt } from "@/features/quiz/components/quizOptionStyles";
import { useQuizCountdown } from "@/features/quiz/hooks/useQuizCountdown";
import { AUTO_LEADERBOARD_DELAY_MS } from "@/lib/quizWorkflow";
import type { QuizWorkflowState } from "@/lib/quizWorkflow";
import { Button } from "@/shared/ui/Button";
import { CheckIcon } from "@/shared/ui/icons";
import { RoomJoinPanel } from "@/shared/ui/RoomJoinPanel";
import type { QuizGuest, QuizQuestion } from "@/types/quiz";

/** Seconds at which the live countdown switches to its urgent color. */
const COUNTDOWN_URGENT_SECONDS = 5;

interface HostGameControlProps {
  roomId: string;
  state: QuizWorkflowState;
  guests: QuizGuest[];
  onStartQuestion: (index: number) => void;
  onReveal: () => void;
  onShowLeaderboard: () => void;
  onNextQuestion: () => void;
  onEndGame: () => void;
  /** Room/session actions shown under the lobby controls. */
  lobbyAside?: ReactNode;
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
  lobbyAside,
}: HostGameControlProps) {
  const {
    phase,
    deck,
    currentQuestion,
    currentQuestionIndex,
    answerCounts,
    answeredCount,
  } = state;
  const total = deck?.questions.length ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AnimatePresence initial={false} mode="wait">
        {phase === "lobby" ? (
          <LobbyView
            key="lobby"
            roomId={roomId}
            deck={deck}
            guests={guests}
            onStartQuestion={onStartQuestion}
            aside={lobbyAside}
          />
        ) : phase === "live" ? (
          <LiveView
            key="live"
            question={currentQuestion}
            index={currentQuestionIndex}
            total={total}
            startedAtMs={state.questionStartedAtMs}
            answeredCount={answeredCount}
            onReveal={onReveal}
          />
        ) : phase === "reveal" ? (
          <RevealView
            key="reveal"
            question={currentQuestion}
            index={currentQuestionIndex}
            total={total}
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

function PhaseFrame({
  children,
  width = "wide",
}: {
  children: ReactNode;
  width?: "wide" | "narrow";
}) {
  return (
    <motion.div
      className={`mx-auto flex w-full flex-col gap-8 ${width === "wide" ? "max-w-4xl" : "max-w-2xl"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function QuestionHeading({
  meta,
  prompt,
}: {
  meta: ReactNode;
  prompt: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium tabular-nums text-fg-muted">{meta}</p>
      <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl lg:text-5xl">
        {prompt}
      </h2>
    </div>
  );
}

function LobbyView({
  roomId,
  deck,
  guests,
  onStartQuestion,
  aside,
}: {
  roomId: string;
  deck: QuizWorkflowState["deck"];
  guests: QuizGuest[];
  onStartQuestion: (index: number) => void;
  aside?: ReactNode;
}) {
  const questions = deck?.questions ?? [];

  return (
    <motion.div
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <RoomJoinPanel roomId={roomId} className="lg:sticky lg:top-6" />

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div aria-live="polite">
              <p className="text-5xl font-bold tabular-nums tracking-tight text-fg">
                {guests.length}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                {guests.length === 1 ? "guest" : "guests"} joined
              </p>
            </div>
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-fg-secondary">
                {deck?.name ?? "Ready to play"}
              </p>
              <p className="text-xs tabular-nums text-fg-muted">
                {questions.length} {questions.length === 1 ? "question" : "questions"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => onStartQuestion(0)}
            disabled={!questions.length}
            className="w-full text-base font-semibold"
          >
            Start first question
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-semibold text-fg-secondary">Up next</h2>
          {questions.length === 0 ? (
            <p className="px-1 text-sm text-fg-muted">No questions in this deck.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
              {questions.map((question, index) => (
                <li key={question.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-xs font-bold tabular-nums text-primary-text">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fg-secondary">
                    {question.prompt}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                    {question.timeLimitMs / 1000}s
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {aside}
      </div>
    </motion.div>
  );
}

function LiveView({
  question,
  index,
  total,
  startedAtMs,
  answeredCount,
  onReveal,
}: {
  question: QuizQuestion | null;
  index: number;
  total: number;
  startedAtMs: number | null;
  answeredCount: number;
  onReveal: () => void;
}) {
  const timeLimitMs = question?.timeLimitMs ?? 0;
  const remainingMs = useQuizCountdown({
    active: true,
    startedAtMs,
    timeLimitMs,
    onExpire: () => undefined,
  });

  if (!question) return null;

  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = seconds <= COUNTDOWN_URGENT_SECONDS;
  const remainingRatio = timeLimitMs > 0 ? Math.max(0, remainingMs / timeLimitMs) : 0;

  return (
    <PhaseFrame>
      <QuestionHeading
        meta={`Question ${index + 1} of ${total}`}
        prompt={question.prompt}
      />

      <section className="grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="flex flex-col gap-1 border-r border-line p-5 sm:p-6">
          <p
            className={`text-5xl font-bold tabular-nums tracking-tight sm:text-6xl ${urgent ? "text-danger" : "text-fg"}`}
          >
            {seconds}
          </p>
          <p className="text-sm text-fg-muted">
            {seconds === 1 ? "second" : "seconds"} left
          </p>
        </div>
        <div className="flex flex-col gap-1 p-5 sm:p-6" aria-live="polite">
          <p className="text-5xl font-bold tabular-nums tracking-tight text-primary-text sm:text-6xl">
            {answeredCount}
          </p>
          <p className="text-sm text-fg-muted">
            {answeredCount === 1 ? "answer" : "answers"} received
          </p>
        </div>
        <div className="col-span-2 h-1.5 bg-line" aria-hidden>
          <div
            className={`h-full transition-[width] duration-300 ease-linear ${urgent ? "bg-danger" : "bg-primary"}`}
            style={{ width: `${remainingRatio * 100}%` }}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Button
          type="button"
          onClick={onReveal}
          className="w-full text-base font-semibold sm:w-auto sm:min-w-64"
        >
          Reveal answers now
        </Button>
        <p className="text-center text-sm text-fg-muted sm:text-left">
          Auto-reveals at 0. Choice results stay hidden until reveal.
        </p>
      </div>
    </PhaseFrame>
  );
}

function RevealView({
  question,
  index,
  total,
  answerCounts,
  onShowLeaderboard,
}: {
  question: QuizQuestion | null;
  index: number;
  total: number;
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
    <PhaseFrame>
      <QuestionHeading
        meta={`Question ${index + 1} of ${total} · Answers revealed`}
        prompt={question.prompt}
      />

      <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-3 pr-4">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl text-zinc-950 ${correctColor}`}
        >
          <CheckIcon className="size-5" strokeWidth={2.5} />
        </span>
        <p className="min-w-0 flex-1 truncate text-base font-semibold text-success">
          {correctText}
        </p>
      </div>

      <LiveChart question={question} answerCounts={answerCounts} reveal />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Button
          type="button"
          onClick={onShowLeaderboard}
          className="w-full text-base font-semibold sm:w-auto sm:min-w-64"
        >
          Show leaderboard now
        </Button>
        <p className="text-center text-sm tabular-nums text-fg-muted sm:text-left">
          Auto-advances to the leaderboard in {AUTO_LEADERBOARD_DELAY_MS / 1000}s.
        </p>
      </div>
    </PhaseFrame>
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
  const total = deck?.questions.length ?? 0;
  const hasNext = total > currentQuestionIndex + 1;

  return (
    <PhaseFrame width="narrow">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Leaderboard
        </h2>
        <p className="text-sm tabular-nums text-fg-muted">
          Top {topLeaderboard.length} after question {currentQuestionIndex + 1} of {total}
          {leaderboard.length > topLeaderboard.length
            ? ` · ${leaderboard.length} guests in this room`
            : null}
        </p>
      </div>
      <HostLeaderboard entries={topLeaderboard} />
      <Button
        type="button"
        onClick={hasNext ? onNextQuestion : onEndGame}
        className="w-full text-base font-semibold"
      >
        {hasNext ? "Next question" : "End quiz"}
      </Button>
    </PhaseFrame>
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
    <PhaseFrame width="narrow">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          Final podium
        </h2>
        <p className="text-sm text-fg-muted">Quiz complete</p>
      </div>
      <Podium topThree={topThree} />
      <Button type="button" onClick={onEndGame} className="w-full text-base font-semibold">
        Done
      </Button>
    </PhaseFrame>
  );
}
