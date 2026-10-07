"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AnswerPad } from "@/features/quiz/components/AnswerPad";
import { GuestFeedback } from "@/features/quiz/components/GuestFeedback";
import { HostLeaderboard } from "@/features/quiz/components/HostLeaderboard";
import { Podium } from "@/features/quiz/components/Podium";
import { QuizMusicToggle } from "@/features/quiz/components/QuizMusicToggle";
import { useQuizGuest } from "@/features/quiz/hooks/useQuizGuest";
import { confirmDialog } from "@/shared/feedback/dialogStore";
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
      <div className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
        Joining quiz…
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-danger">
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
      <header className="shrink-0 border-b border-line bg-background/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-text sm:text-xs">
            Quiz
          </p>
          <div className="ml-auto flex items-center gap-2">
            <QuizMusicToggle phase={state.phase} />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void confirmDialog({
                  title: "Leave this room?",
                  message:
                    "Your nickname and saved room on this device will be cleared. You can scan the QR again to rejoin.",
                  confirmLabel: "Leave",
                  tone: "danger",
                }).then((confirmed) => {
                  if (confirmed) onLeaveRoom();
                });
              }}
              className="shrink-0 px-3 py-1.5 text-xs text-fg-muted hover:text-danger"
            >
              Leave room
            </Button>
          </div>
        </div>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/30 text-xs font-bold uppercase text-primary-text"
            aria-hidden
          >
            {displayName.slice(0, 1)}
          </span>
          <span className="max-w-[200px] truncate text-sm font-medium text-fg-secondary">
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
              <div
                className="h-10 w-10 animate-spin rounded-full border-2 border-primary/40 border-t-primary"
                aria-hidden="true"
              />
              <p className="text-base font-medium text-fg-secondary">
                Waiting for the host to start…
              </p>
              <p className="text-sm text-fg-muted">
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
                <p className="mt-4 text-center text-sm text-danger">
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
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-text">
                  Top {state.topLeaderboard.length}
                </p>
                <h2 className="text-2xl font-bold text-fg sm:text-3xl">
                  Leaderboard
                </h2>
              </div>
              <HostLeaderboard entries={state.topLeaderboard} />
              <p className="text-center text-sm text-fg-muted">
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
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-text">
                  Quiz complete
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-fg">
                  Final podium
                </h2>
              </div>
              <Podium topThree={state.topLeaderboard.slice(0, 3)} />
              <p className="text-center text-sm text-fg-muted">
                Thanks for playing!
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
