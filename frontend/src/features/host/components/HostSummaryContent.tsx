"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SummaryHistoryModal } from "@/features/summary/components/SummaryHistoryModal";
import { useHostRoomSummary } from "@/features/summary/hooks/useHostRoomSummary";
import { getGroupContributors } from "@/lib/aggregateEntries";
import { buildContributorTags } from "@/lib/contributorTags";
import { getSummaryTopicLabel } from "@/lib/hostSummaryState";
import { ROUND_QUESTION_MAX_LENGTH } from "@/lib/constants";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { RoundQuestionCard } from "@/shared/ui/RoundQuestionCard";
import { GuestNameBubbles } from "@/shared/ui/GuestNameBubbles";

const RANK_STYLES = [
  "from-primary/15 to-background border-primary/30",
  "from-primary/20 to-background/40 border-primary/25",
  "from-cyan-600/20 to-background/40 border-cyan-400/25",
  "from-amber-600/20 to-background/40 border-amber-400/25",
  "from-emerald-600/20 to-background/40 border-emerald-400/25",
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
  const [nextQuestion, setNextQuestion] = useState("");
  const {
    status,
    topGroups,
    summaries,
    busy,
    error,
    question,
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
        className="text-sm text-fg-muted"
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

      <RoundQuestionCard question={question} />

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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-5 text-center text-sm text-danger">
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
              const guestTags = group
                ? buildContributorTags(getGroupContributors(group))
                : [];

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
                    <h2 className="text-lg font-semibold text-fg sm:text-xl">
                      {getSummaryTopicLabel(card)}
                    </h2>
                    <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-text">
                      #{index + 1}
                    </span>
                  </motion.div>
                  <p className="flex-1 text-sm leading-relaxed text-fg sm:text-base">
                    {card.summary}
                  </p>
                  <div className="mt-auto flex flex-col gap-2">
                    <GuestNameBubbles tags={guestTags} />
                    <p className="text-xs text-fg-muted">
                      {group?.count ?? 0} contribution
                      {(group?.count ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
          <p className="text-center text-xs text-fg-muted">
            Refreshing creates a new summary and saves this one to summary history.
          </p>
        </>
      ) : null}

      {hasSummary && roomId ? (
        <div className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-base font-semibold text-fg">
            Ready for a new round?
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Clears guest inputs and the active summary for this room. Guests stay
            in the room and can submit again — no need to scan the QR code again.
          </p>
          <Input
            value={nextQuestion}
            onChange={(e) => setNextQuestion(e.target.value)}
            placeholder="Next round question (optional)"
            maxLength={ROUND_QUESTION_MAX_LENGTH}
            disabled={busy}
            className="mt-4"
          />
          <Button
            type="button"
            onClick={() => {
              void beginNewRound(nextQuestion).then((started) => {
                if (started) setNextQuestion("");
              });
            }}
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
      className="mb-4 h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
  );
}

function StatusPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      role="status"
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-16 text-center text-sm text-fg-muted sm:py-20 sm:text-base"
    >
      {children}
    </motion.div>
  );
}
