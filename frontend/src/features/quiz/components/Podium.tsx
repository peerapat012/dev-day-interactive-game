"use client";

import { motion } from "framer-motion";
import { HostLeaderboard } from "@/features/quiz/components/HostLeaderboard";
import type { QuizLeaderboardEntry } from "@/types/quiz";

const PODIUM_STYLES: Record<number, { height: string; bg: string; ring: string }> = {
  1: { height: "h-24", bg: "bg-amber-400", ring: "ring-amber-400/40" },
  2: { height: "h-16", bg: "bg-zinc-400", ring: "ring-zinc-400/40" },
  3: { height: "h-12", bg: "bg-amber-700", ring: "ring-amber-700/40" },
};

interface PodiumProps {
  topThree: QuizLeaderboardEntry[];
}

export function Podium({ topThree }: PodiumProps) {
  if (!topThree.length) {
    return (
      <p className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 text-sm text-zinc-400">
        No final scores to crown yet.
      </p>
    );
  }

  const ordered = [topThree[1], topThree[0], topThree[2]].filter(Boolean) as QuizLeaderboardEntry[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-center gap-3">
        {ordered.map((entry, index) => {
          const style = PODIUM_STYLES[entry.rank] ?? PODIUM_STYLES[3];
          return (
            <motion.div
              key={entry.guestUuid}
              className="flex w-24 flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0, delay: index * 0.08 }}
            >
              <span className="max-w-full truncate text-xs font-medium text-zinc-200">
                {entry.displayName}
              </span>
              <span className="font-mono text-lg font-bold tabular-nums text-violet-300">
                {entry.score}
              </span>
              <motion.div
                className={`w-full ${style.height} ${style.bg} flex items-start justify-center rounded-t-2xl pt-2 text-xs font-bold text-zinc-950 ring-2 ${style.ring}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0, delay: index * 0.08 }}
                style={{ transformOrigin: "bottom" }}
              >
                {entry.rank === 1 ? "1st" : entry.rank === 2 ? "2nd" : "3rd"}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      <HostLeaderboard entries={topThree} full />
    </div>
  );
}
