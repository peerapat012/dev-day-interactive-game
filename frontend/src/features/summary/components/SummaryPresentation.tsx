"use client";

import { motion } from "framer-motion";
import { useTopGroupsSummary } from "@/features/summary/hooks/useTopGroupsSummary";
import { PageShell } from "@/shared/components/PageShell";
import { Button } from "@/shared/ui/Button";

const RANK_STYLES = [
  "from-violet-600/30 to-violet-950/40 border-violet-400/30",
  "from-fuchsia-600/25 to-zinc-950/40 border-fuchsia-400/25",
  "from-cyan-600/20 to-zinc-950/40 border-cyan-400/25",
  "from-amber-600/20 to-zinc-950/40 border-amber-400/25",
  "from-emerald-600/20 to-zinc-950/40 border-emerald-400/25",
] as const;

function summaryGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  if (count === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
}

export function SummaryPresentation() {
  const {
    topGroups,
    summaries,
    loading,
    phase,
    error,
    isHydrated,
    hasSummarized,
    pendingCount,
    entryCount,
    runSummarize,
  } = useTopGroupsSummary();

  const groupCount = topGroups.length;

  return (
    <PageShell
      title="Summary"
      description="Classify submissions and view the top groups with AI-generated summaries."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-zinc-400"
          >
            {entryCount === 0 ? (
              <span>No submissions yet.</span>
            ) : pendingCount > 0 && !hasSummarized ? (
              <span>
                {entryCount} submission{entryCount === 1 ? "" : "s"} ·{" "}
                {pendingCount} waiting to classify
              </span>
            ) : hasSummarized ? (
              <span>
                Top {groupCount} classified group{groupCount === 1 ? "" : "s"}
              </span>
            ) : (
              <span>
                {entryCount} submission{entryCount === 1 ? "" : "s"} ready to
                classify
              </span>
            )}
          </motion.div>

          <Button
            type="button"
            onClick={() => void runSummarize()}
            disabled={loading || entryCount === 0}
            className="w-full shrink-0 px-6 py-3 sm:w-auto"
          >
            {phase === "classifying"
              ? "Classifying…"
              : phase === "summarizing"
                ? "Summarizing…"
                : hasSummarized
                  ? "Refresh"
                  : "Summarize"}
          </Button>
        </div>

        {!isHydrated ? (
          <StatusPanel>Loading summary data…</StatusPanel>
        ) : null}

        {isHydrated && entryCount === 0 ? (
          <StatusPanel>
            Not enough data yet. Add entries on the Cloud page first.
          </StatusPanel>
        ) : null}

        {loading ? (
          <StatusPanel>
            <motion.div
              className="mb-4 h-10 w-10 rounded-full border-2 border-violet-400 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />
            {phase === "classifying"
              ? "Classifying submissions…"
              : "Generating summaries…"}
          </StatusPanel>
        ) : null}

        {error && !loading ? (
          <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {!loading && !hasSummarized && entryCount > 0 && !error ? (
          <StatusPanel>
            Press <strong className="text-violet-300">Summarize</strong> to
            classify all inputs and show the top groups.
          </StatusPanel>
        ) : null}

        {!loading && hasSummarized && groupCount > 0 ? (
          <>
            <ul className="flex flex-wrap gap-2">
              {topGroups.map((g, i) => (
                <li
                  key={g.group}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300"
                >
                  <span className="font-semibold text-violet-300">#{i + 1}</span>
                  <span className="font-medium capitalize">{g.group}</span>
                  <span className="text-zinc-500">· {g.count}</span>
                </li>
              ))}
            </ul>

            {summaries.length > 0 ? (
              <div
                className={`grid gap-4 ${summaryGridClass(summaries.length)}`}
              >
                {summaries.map((card, index) => {
                  const group = topGroups.find((g) => g.group === card.group);
                  const style =
                    RANK_STYLES[index] ??
                    RANK_STYLES[RANK_STYLES.length - 1];

                  return (
                    <motion.article
                      key={card.group}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className={`flex flex-col gap-3 rounded-3xl border bg-gradient-to-br p-5 shadow-xl ${style}`}
                    >
                      <motion.div className="flex items-start justify-between gap-2">
                        <h2 className="text-lg font-semibold capitalize text-white sm:text-xl">
                          {card.group}
                        </h2>
                        <span className="shrink-0 rounded-full bg-black/30 px-2 py-0.5 text-xs font-medium text-violet-200">
                          #{index + 1}
                        </span>
                      </motion.div>
                      <p className="flex-1 text-sm leading-relaxed text-zinc-100 sm:text-base">
                        {card.summary}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {group?.count ?? 0} contribution
                        {(group?.count ?? 0) === 1 ? "" : "s"}
                      </p>
                    </motion.article>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </PageShell>
  );
}

function StatusPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      role="status"
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-zinc-500 sm:py-20 sm:text-base"
    >
      {children}
    </motion.div>
  );
}
