"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  optionColorAt,
  optionLetter,
} from "@/features/quiz/components/quizOptionStyles";
import { useQuizCountdown } from "@/features/quiz/hooks/useQuizCountdown";
import type { QuizQuestion } from "@/types/quiz";

interface AnswerPadProps {
  question: QuizQuestion;
  index: number;
  startedAtMs: number | null;
  answeredOptionId: string | null;
  submitting: boolean;
  onSubmit: (optionId: string) => void;
  onExpire: () => void;
}

export function AnswerPad({
  question,
  index,
  startedAtMs,
  answeredOptionId,
  submitting,
  onSubmit,
  onExpire,
}: AnswerPadProps) {
  const remainingMs = useQuizCountdown({
    active: true,
    startedAtMs,
    timeLimitMs: question.timeLimitMs,
    onExpire,
  });

  const remainingPct = useMemo(
    () =>
      Math.max(
        0,
        Math.min(100, (remainingMs / question.timeLimitMs) * 100),
      ),
    [remainingMs, question.timeLimitMs],
  );

  const seconds = Math.ceil(remainingMs / 1000);
  const answered = answeredOptionId !== null;
  const locked = answered || submitting;

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
          {seconds} {seconds === 1 ? "second" : "seconds"} left
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-violet-500"
            initial={false}
            animate={{ width: `${remainingPct}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option, optionIndex) => {
          const color = optionColorAt(optionIndex);
          const isSelected = option.id === answeredOptionId;
          const isDisabled = locked && !isSelected;
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => {
                if (locked) return;
                onSubmit(option.id);
              }}
              disabled={locked}
              className={`flex min-h-[64px] items-center gap-3 rounded-3xl border border-transparent p-4 text-left transition-colors ${
                isSelected
                  ? `${color.bar} text-zinc-950`
                  : `bg-zinc-900/70 text-zinc-100 ${
                      isDisabled
                        ? "opacity-40"
                        : "active:bg-zinc-800 hover:bg-zinc-800/80"
                    }`
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                duration: 0.3,
                bounce: 0,
                delay: optionIndex * 0.05,
              }}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-mono text-sm font-bold ${
                  isSelected
                    ? "bg-white/25 text-zinc-950"
                    : `${color.bar} text-zinc-950`
                }`}
              >
                {isSelected ? "✓" : optionLetter(optionIndex)}
              </span>
              <span className="min-w-0 flex-1 text-base font-medium">
                {option.text}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2">
        {answered ? (
          <motion.p
            className="text-sm font-medium text-emerald-300"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Answer locked in — waiting for the host to reveal.
          </motion.p>
        ) : submitting ? (
          <p className="text-sm text-zinc-400">Sending answer…</p>
        ) : (
          <p className="text-sm text-zinc-500">Tap an option to answer.</p>
        )}
      </div>
    </div>
  );
}
