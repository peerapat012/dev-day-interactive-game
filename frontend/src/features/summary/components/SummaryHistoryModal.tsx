"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useSummaryHistory } from "@/features/summary/hooks/useSummaryHistory";
import { formatSavedAt } from "@/lib/formatSavedAt";
import { getGroupContributors } from "@/lib/aggregateEntries";
import { buildContributorTags } from "@/lib/contributorTags";
import { getSummaryTopicLabel } from "@/lib/hostSummaryState";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { TagCloud } from "@/shared/ui/TagCloud";
import type { SavedRoundSnapshot } from "@/types/room";

interface SummaryHistoryModalProps {
  open: boolean;
  onClose: () => void;
  roomRowId: string | undefined;
}

export function SummaryHistoryModal({
  open,
  onClose,
  roomRowId,
}: SummaryHistoryModalProps) {
  const { rounds, loading, error, refresh } = useSummaryHistory(roomRowId, open);
  const [selected, setSelected] = useState<SavedRoundSnapshot | null>(null);

  function handleClose() {
    setSelected(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={selected ? "Round summary" : "Summary history"}
    >
      {selected ? (
        <HistoryRoundDetail
          snapshot={selected}
          onBack={() => setSelected(null)}
        />
      ) : (
        <HistoryList
          rounds={rounds}
          loading={loading}
          error={error}
          onSelect={setSelected}
          onRetry={() => void refresh()}
        />
      )}
    </Modal>
  );
}

function HistoryList({
  rounds,
  loading,
  error,
  onSelect,
  onRetry,
}: {
  rounds: SavedRoundSnapshot[];
  loading: boolean;
  error: string | null;
  onSelect: (snapshot: SavedRoundSnapshot) => void;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">Loading history…</p>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-rose-300">{error}</p>
        <Button type="button" variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No saved summaries yet. Refresh the active summary to move the current
        version into history.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 pb-2">
      {rounds.map((round, index) => {
        const summaryCount = round.summaries.length;
        const roundNumber = rounds.length - index;

        return (
          <li key={`${round.savedAt}-${index}`}>
            <button
              type="button"
              onClick={() => onSelect(round)}
              className="flex w-full flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors active:bg-white/10"
            >
              <span className="text-sm font-semibold text-zinc-100">
                Round {roundNumber}
              </span>
              <span className="text-xs text-zinc-400">
                {formatSavedAt(round.savedAt)}
              </span>
              <span className="text-xs text-zinc-500">
                {summaryCount} summar{summaryCount === 1 ? "y" : "ies"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function HistoryRoundDetail({
  snapshot,
  onBack,
}: {
  snapshot: SavedRoundSnapshot;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <Button type="button" variant="ghost" onClick={onBack} className="w-fit px-4">
        ← Back to list
      </Button>
      <p className="text-xs text-zinc-500">{formatSavedAt(snapshot.savedAt)}</p>

      <ul className="flex flex-col gap-3">
        {snapshot.summaries.map((card, index) => {
          const group = snapshot.groups.find((g) => g.group === card.group);
          const contributorTags = group
            ? buildContributorTags(getGroupContributors(group))
            : [];

          return (
            <motion.li
              key={`${card.group}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4"
            >
              <h3 className="text-sm font-semibold text-violet-200">
                {getSummaryTopicLabel(card)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                {card.summary}
              </p>
              {group ? (
                <p className="mt-2 text-xs text-zinc-500">
                  {group.count} contribution{group.count === 1 ? "" : "s"}
                </p>
              ) : null}

              <TagCloud tags={contributorTags} label="Guests" />
            </motion.li>
          );
        })}
      </ul>

      {snapshot.summaries.length === 0 ? (
        <p className="text-sm text-zinc-500">No summary text saved for this round.</p>
      ) : null}
    </div>
  );
}
