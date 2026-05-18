"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTopGroupsSummary } from "@/features/summary/hooks/useTopGroupsSummary";
import { AppShell } from "@/shared/components/layout/AppShell";
import { PlayerBadge } from "@/shared/components/PlayerBadge";
import { Button } from "@/shared/ui/Button";

const RANK_STYLES = [
  "from-violet-600/30 to-violet-950/40 border-violet-400/30",
  "from-fuchsia-600/25 to-zinc-950/40 border-fuchsia-400/25",
  "from-cyan-600/20 to-zinc-950/40 border-cyan-400/25",
] as const;

export function SummaryPresentation() {
  const {
    topGroups,
    summaries,
    loading,
    error,
    isHydrated,
    hasSummarized,
    runSummarize,
  } = useTopGroupsSummary();

  return (
    <AppShell showTabBar>
      <div className="mx-auto flex min-h-dvh w-full max-w-[1920px] flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 xl:px-16">
        {/* Control bar — compact for operator, readable on TV */}
        <header className="mb-6 flex shrink-0 flex-col gap-4 border-b border-white/10 pb-6 lg:mb-8 lg:flex-row lg:items-end lg:justify-between lg:pb-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-400 lg:text-sm">
              Word Cloud Game · Display
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
              Top 3 Summary
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400 lg:text-lg xl:text-xl">
              Presentation view for monitor, TV, or projector
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
            <PlayerBadge />
            <div className="flex flex-wrap gap-2">
              <Link
                href="/groups"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/5 lg:text-base"
              >
                Groups
              </Link>
              <Button
                type="button"
                onClick={() => void runSummarize()}
                disabled={loading || !topGroups.length}
                className="px-8 py-3 text-base lg:px-10 lg:py-4 lg:text-lg"
              >
                {loading
                  ? "Summarizing…"
                  : hasSummarized
                    ? "Refresh"
                    : "Summarize"}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col">
          {!isHydrated ? (
            <PresentationMessage>Loading summary data…</PresentationMessage>
          ) : null}

          {isHydrated && !topGroups.length ? (
            <PresentationMessage>
              Not enough data yet. Add entries on the live cloud page.
            </PresentationMessage>
          ) : null}

          {isHydrated && topGroups.length > 0 ? (
            <>
              {/* Group leaderboard strip */}
              <ul className="mb-6 flex flex-wrap justify-center gap-3 lg:mb-10 lg:gap-5">
                {topGroups.map((g, i) => (
                  <li
                    key={g.group}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:px-6 lg:py-4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/25 text-lg font-bold text-violet-200 lg:h-14 lg:w-14 lg:text-2xl">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-base font-semibold capitalize text-white lg:text-2xl xl:text-3xl">
                        {g.group}
                      </p>
                      <p className="text-sm text-zinc-500 lg:text-lg">
                        {g.count} inputs
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-violet-500/20 bg-violet-500/5 py-20 lg:min-h-[50vh]">
                  <motion.div
                    className="h-16 w-16 rounded-full border-4 border-violet-400 border-t-transparent lg:h-24 lg:w-24"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <p className="text-lg text-violet-200 lg:text-2xl xl:text-3xl">
                    Generating summaries…
                  </p>
                </div>
              ) : null}

              {error && !loading ? (
                <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-center text-base text-rose-300 lg:text-xl">
                  {error}
                </p>
              ) : null}

              {!loading && hasSummarized && summaries.length > 0 ? (
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
                  {summaries.map((card, index) => {
                    const group = topGroups.find((g) => g.group === card.group);
                    const style =
                      RANK_STYLES[index] ?? RANK_STYLES[RANK_STYLES.length - 1];

                    return (
                      <motion.article
                        key={card.group}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.12 }}
                        className={`relative flex min-h-[280px] flex-col overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-2xl sm:min-h-[320px] lg:min-h-[min(52vh,560px)] lg:p-8 xl:min-h-[min(58vh,640px)] xl:p-10 ${style}`}
                      >
                        <span
                          className="pointer-events-none absolute -right-2 -top-4 select-none text-[5rem] font-black leading-none text-white/[0.06] lg:text-[7rem] xl:text-[8rem]"
                          aria-hidden
                        >
                          {index + 1}
                        </span>
                        <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                          <h2 className="text-2xl font-bold capitalize leading-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl">
                            {card.group}
                          </h2>
                          <span className="shrink-0 rounded-full bg-black/30 px-3 py-1 text-sm font-medium text-violet-200 lg:text-base">
                            #{index + 1}
                          </span>
                        </div>
                        <p className="relative z-10 flex-1 text-base leading-relaxed text-zinc-100 sm:text-lg lg:text-xl lg:leading-relaxed xl:text-2xl xl:leading-relaxed 2xl:text-3xl">
                          {card.summary}
                        </p>
                        <p className="relative z-10 mt-4 text-xs text-zinc-500 lg:text-sm">
                          {group?.count ?? 0} contributions
                        </p>
                      </motion.article>
                    );
                  })}
                </div>
              ) : null}

              {!loading && !hasSummarized && !error ? (
                <PresentationMessage>
                  Press <strong className="text-violet-300">Summarize</strong> to
                  generate AI summaries for the top 3 groups.
                </PresentationMessage>
              ) : null}
            </>
          ) : null}
        </main>
      </div>
    </AppShell>
  );
}

function PresentationMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 py-20 text-center text-base text-zinc-500 lg:min-h-[40vh] lg:text-2xl xl:text-3xl">
      {children}
    </p>
  );
}
