"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AnswerPad } from "@/features/quiz/components/AnswerPad";
import { GuestFeedback } from "@/features/quiz/components/GuestFeedback";
import { HostLeaderboard } from "@/features/quiz/components/HostLeaderboard";
import { Podium } from "@/features/quiz/components/Podium";
import { QuizMusicToggle } from "@/features/quiz/components/QuizMusicToggle";
import { useQuizGuest } from "@/features/quiz/hooks/useQuizGuest";
import { Button } from "@/shared/ui/Button";

interface QuizGuestScreenProps {
  onLeaveRoom: () => void;
}

export function QuizGuestScreen({ onLeaveRoom }: QuizGuestScreenProps) {
  const { ready, error, state, displayName, submit } = useQuizGuest();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Joining quiz…
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-rose-400">
          {error ?? "Could not open the quiz."}
        </p>
        <Button type="button" variant="ghost" onClick={onLeaveRoom}>
          Back to join
        </Button>
      </div>
    );
  }

  const { phase, currentQuestion, currentQuestionIndex, myAnswer } = state;
  const answeredOptionId = myAnswer?.selectedOptionId ?? null;

  async function handleSubmit(optionId: string) {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submit(optionId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      className="flex min-h-dvh flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="shrink-0 border-b border-white/10 bg-zinc-950/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400 sm:text-xs">
            Quiz
          </p>
          <div className="ml-auto flex items-center gap-2">
            <QuizMusicToggle phase={state.phase} />
            <Button
              type="button"
              variant="ghost"
              onClick={onLeaveRoom}
              className="shrink-0 px-3 py-1.5 text-xs text-zinc-400 hover:text-rose-300"
            >
              Leave room
            </Button>
          </div>
        </div>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/30 text-xs font-bold uppercase text-violet-200"
            aria-hidden
          >
            {displayName.slice(0, 1)}
          </span>
          <span className="max-w-[200px] truncate text-sm font-medium text-zinc-200">
            {displayName}
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <AnimatePresence initial={false} mode="wait">
          {phase === "lobby" ? (
            <motion.div
              key="lobby"
              className="flex min-h-full flex-col items-center justify-center gap-3 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <motion.div
                className="h-10 w-10 rounded-full border-2 border-violet-400/40 border-t-violet-300"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-base font-medium text-zinc-200">
                Waiting for the host to start…
              </p>
              <p className="text-sm text-zinc-500">
                Keep this tab open — the first question will appear here.
              </p>
            </motion.div>
          ) : phase === "live" && currentQuestion ? (
            <motion.div
              key={`live-${currentQuestion.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <AnswerPad
                question={currentQuestion}
                index={currentQuestionIndex}
                startedAtMs={state.questionStartedAtMs}
                answeredOptionId={answeredOptionId}
                submitting={submitting}
                onSubmit={(optionId) => void handleSubmit(optionId)}
                onExpire={() => undefined}
              />
              {submitError ? (
                <p className="mt-4 text-center text-sm text-rose-400">
                  {submitError}
                </p>
              ) : null}
            </motion.div>
          ) : phase === "reveal" && currentQuestion ? (
            <motion.div
              key={`reveal-${currentQuestion.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <GuestFeedback
                question={currentQuestion}
                myAnswer={myAnswer}
              />
            </motion.div>
          ) : phase === "leaderboard" ? (
            <motion.div
              key="leaderboard"
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Top {state.topLeaderboard.length}
                </p>
                <h2 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
                  Leaderboard
                </h2>
              </div>
              <HostLeaderboard entries={state.topLeaderboard} />
              <p className="text-center text-sm text-zinc-500">
                Waiting for the host to continue…
              </p>
            </motion.div>
          ) : phase === "podium" ? (
            <motion.div
              key="podium"
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Quiz complete
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-50">
                  Final podium
                </h2>
              </div>
              <Podium topThree={state.topLeaderboard.slice(0, 3)} />
              <p className="text-center text-sm text-zinc-500">
                Thanks for playing!
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
