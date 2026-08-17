"use client";

import { motion } from "framer-motion";
import { optionColorAt } from "@/features/quiz/components/quizOptionStyles";
import type { QuizAnswer, QuizQuestion } from "@/types/quiz";

interface GuestFeedbackProps {
  question: QuizQuestion;
  myAnswer: QuizAnswer | null;
}

export function GuestFeedback({ question, myAnswer }: GuestFeedbackProps) {
  const correctIndex = question.options.findIndex(
    (option) => option.id === question.correctOptionId,
  );
  const correctOption =
    correctIndex >= 0 ? question.options[correctIndex] : null;
  const correctColor =
    correctIndex >= 0 ? optionColorAt(correctIndex).bar : "bg-emerald-500";

  const isCorrect = myAnswer?.isCorrect ?? false;
  const answered = Boolean(myAnswer);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        className={`grid h-24 w-24 place-items-center rounded-full border-2 text-4xl ${
          isCorrect
            ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
            : "border-rose-400/60 bg-rose-500/15 text-rose-300"
        }`}
      >
        {isCorrect ? "✓" : answered ? "✕" : "—"}
      </motion.div>

      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold text-zinc-100">
          {!answered
            ? "No answer submitted"
            : isCorrect
              ? "Correct!"
              : "Not quite"}
        </p>
        {answered ? (
          <p className="text-sm tabular-nums text-zinc-400">
            +{myAnswer?.points ?? 0} points
          </p>
        ) : (
          <p className="text-sm text-zinc-400">
            Too late or missed this one — the answer counts for the leaderboard.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-zinc-950 ${correctColor}`}
        >
          ✓
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-200">
          {correctOption?.text ?? ""}
        </p>
      </div>
    </div>
  );
}
