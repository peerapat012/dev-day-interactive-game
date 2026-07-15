"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SummaryHistoryModal } from "@/features/summary/components/SummaryHistoryModal";
import { useHostRoomSummary } from "@/features/summary/hooks/useHostRoomSummary";
import { getSummaryTopicLabel } from "@/lib/hostSummaryState";
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

export function HostSummaryContent() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const {
    status,
    topGroups,
    summaries,
    busy,
    error,
    isResetting,
    entryCount,
    retry,
    regenerate,
    beginNewRound,
    roomId,
    roomRowId,
  } = useHostRoomSummary();

  const hasSummary = status === "ready" && summaries.length > 0;
  const showSummaryCards = hasSummary && !busy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-zinc-400"
      >
        {status === "loading_saved" ? (
          <span>Loading summary…</span>
        ) : status === "empty" ? (
          <span>No submissions yet for this room.</span>
        ) : status === "generating" ? (
          <span>Generating summary…</span>
        ) : hasSummary ? (
          <span>
            {entryCount} submission{entryCount === 1 ? "" : "s"} · {summaries.length}{" "}
            topic summar{summaries.length === 1 ? "y" : "ies"}
          </span>
        ) : (
          <span>
            {entryCount} submission{entryCount === 1 ? "" : "s"} ready for summary
          </span>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {hasSummary ? (
          <Button
            type="button"
            onClick={() => void regenerate()}
            disabled={busy || entryCount === 0}
            className="w-full shrink-0 px-6 py-3 sm:w-auto"
          >
            Refresh summary
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          onClick={() => setHistoryOpen(true)}
          disabled={!roomRowId}
          className="w-full shrink-0 px-6 py-3 sm:w-auto"
        >
          Summary history
        </Button>
      </motion.div>

      <SummaryHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        roomRowId={roomRowId}
      />

      {status === "loading_saved" ? (
        <StatusPanel>
          <LoadingSpinner />
          Loading saved summary…
        </StatusPanel>
      ) : null}

      {status === "generating" ? (
        <StatusPanel>
          <LoadingSpinner />
          Generating summary…
        </StatusPanel>
      ) : null}

      {status === "empty" ? (
        <StatusPanel>
          Waiting for guest submissions. Share the room link from the Room tab.
        </StatusPanel>
      ) : null}

      {status === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-5 text-center text-sm text-rose-300">
          <p>{error ?? "Unable to load the summary."}</p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void retry()}
            disabled={busy}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {showSummaryCards ? (
        <>
          <motion.div
            className={`grid gap-4 ${summaryGridClass(summaries.length)}`}
          >
            {summaries.map((card, index) => {
              const group = topGroups.find((item) => item.group === card.group);
              const style =
                RANK_STYLES[index] ?? RANK_STYLES[RANK_STYLES.length - 1];

              return (
                <motion.article
                  key={card.group}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`flex flex-col gap-3 rounded-3xl border bg-gradient-to-br p-5 shadow-xl ${style}`}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start justify-between gap-2"
                  >
                    <h2 className="text-lg font-semibold text-white sm:text-xl">
                      {getSummaryTopicLabel(card)}
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
          </motion.div>
          <p className="text-center text-xs text-zinc-500">
            Refreshing creates a new summary and saves this one to summary history.
          </p>
        </>
      ) : null}

      {hasSummary && roomId ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5">
          <p className="text-base font-semibold text-zinc-100">
            Ready for a new round?
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Clears guest inputs and the active summary for this room. Guests stay
            in the room and can submit again — no need to scan the QR code again.
          </p>
          <Button
            type="button"
            onClick={() => void beginNewRound()}
            disabled={busy}
            className="mt-4 w-full sm:w-auto"
          >
            {isResetting ? "Starting new round…" : "Start new round"}
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}

function LoadingSpinner() {
  return (
    <motion.div
      className="mb-4 h-10 w-10 rounded-full border-2 border-violet-400 border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
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
