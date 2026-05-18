"use client";

import { motion } from "framer-motion";
import { useTopGroupsSummary } from "@/features/summary/hooks/useTopGroupsSummary";
import { Button } from "@/shared/ui/Button";

export function SummaryCards() {
  const {
    topGroups,
    summaries,
    loading,
    error,
    isHydrated,
    hasSummarized,
    runSummarize,
  } = useTopGroupsSummary();

  if (!isHydrated) {
    return <p className="text-sm text-zinc-500">Loading summary data…</p>;
  }

  if (!topGroups.length) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
        Not enough data yet. Add entries on the live cloud page.
      </p>
    );
  }

  return (
    <motion.div className="flex flex-col gap-6" layout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Top {topGroups.length} groups by submission count
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {topGroups.map((g, i) => (
              <li
                key={g.group}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
              >
                #{i + 1}{" "}
                <span className="font-medium capitalize">{g.group}</span>
                <span className="text-zinc-500"> · {g.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button
          type="button"
          onClick={() => void runSummarize()}
          disabled={loading}
          className="w-full shrink-0 px-6 py-3 sm:w-auto"
        >
          {loading ? "Summarizing…" : hasSummarized ? "Summarize again" : "Summarize"}
        </Button>
      </div>

      {loading ? (
        <motion.div
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-violet-500/20 bg-violet-500/5 py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-violet-400 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-violet-200">
            Generating summaries for top groups…
          </p>
        </motion.div>
      ) : null}

      {error && !loading ? (
        <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {!loading && hasSummarized && summaries.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((card, index) => {
            const group = topGroups.find((g) => g.group === card.group);
            return (
              <motion.article
                key={card.group}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 shadow-xl"
              >
                <motion.div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold capitalize text-violet-300">
                    {card.group}
                  </h3>
                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                    #{index + 1}
                  </span>
                </motion.div>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {card.summary}
                </p>
                <p className="text-xs text-zinc-500">
                  {group?.count ?? 0} inputs · FastAPI /summarize
                </p>
              </motion.article>
            );
          })}
        </div>
      ) : null}

      {!loading && !hasSummarized && !error ? (
        <p className="text-center text-sm text-zinc-500">
          Click <strong className="text-zinc-400">Summarize</strong> to generate
          AI summaries for the top groups.
        </p>
      ) : null}
    </motion.div>
  );
}
