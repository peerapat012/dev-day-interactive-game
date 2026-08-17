"use client";

import { motion } from "framer-motion";
import type { QuizLeaderboardEntry } from "@/types/quiz";

const MEDAL_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface HostLeaderboardProps {
  entries: QuizLeaderboardEntry[];
  /** Show the full list (host view); otherwise top-5 only. */
  full?: boolean;
}

export function HostLeaderboard({ entries, full = false }: HostLeaderboardProps) {
  const visible = full ? entries : entries.slice(0, 5);

  if (!visible.length) {
    return (
      <p className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 text-sm text-zinc-400">
        No scores yet — answers from guests will appear here as the game runs.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map((entry, index) => (
        <motion.div
          key={entry.guestUuid}
          className={`flex items-center gap-3 rounded-2xl border p-3 ${
            entry.rank === 1
              ? "border-amber-400/40 bg-amber-500/10"
              : "border-white/10 bg-zinc-900/60"
          }`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <span className="w-8 shrink-0 text-center text-lg tabular-nums">
            {MEDAL_EMOJI[entry.rank] ?? (
              <span className="text-sm font-semibold text-zinc-400">
                {entry.rank}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">
            {entry.displayName}
          </span>
          <span className="shrink-0 text-xs text-zinc-500">
            {entry.correct} ✓
          </span>
          <span className="w-16 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-violet-300">
            {entry.score}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
