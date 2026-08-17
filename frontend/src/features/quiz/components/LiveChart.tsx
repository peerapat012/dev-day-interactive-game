"use client";

import { motion } from "framer-motion";
import { optionColorAt, optionLetter } from "@/features/quiz/components/quizOptionStyles";
import type { QuizQuestion } from "@/types/quiz";

interface LiveChartProps {
  question: QuizQuestion;
  answerCounts: Record<string, number>;
  reveal?: boolean;
}

export function LiveChart({ question, answerCounts, reveal = false }: LiveChartProps) {
  const total = question.options.reduce(
    (sum, option) => sum + (answerCounts[option.id] ?? 0),
    0,
  );
  const maxCount = Math.max(
    1,
    ...question.options.map((option) => answerCounts[option.id] ?? 0),
  );

  return (
    <div className="flex flex-col gap-2.5">
      {question.options.map((option, index) => {
        const count = answerCounts[option.id] ?? 0;
        const pct = Math.round((count / maxCount) * 100);
        const color = optionColorAt(index);
        const isCorrect = reveal && option.id === question.correctOptionId;
        const isWrong = reveal && !isCorrect;

        return (
          <div key={option.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold text-zinc-950 ${color.bar}`}
                >
                  {optionLetter(index)}
                </span>
                <span
                  className={`truncate ${
                    isCorrect
                      ? "font-semibold text-white"
                      : isWrong
                        ? "text-zinc-500"
                        : color.text
                  }`}
                >
                  {option.text}
                </span>
                {isCorrect ? (
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Correct
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400">
                {count}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className={`h-full rounded-full ${color.bar} ${
                  isWrong ? "opacity-40" : ""
                }`}
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              />
            </div>
          </div>
        );
      })}
      <p className="mt-1 text-right text-xs tabular-nums text-zinc-500">
        {total} {total === 1 ? "answer" : "answers"}
      </p>
    </div>
  );
}
