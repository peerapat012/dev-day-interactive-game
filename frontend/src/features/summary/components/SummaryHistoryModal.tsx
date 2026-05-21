"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useSummaryHistory } from "@/features/summary/hooks/useSummaryHistory";
import { formatSavedAt } from "@/lib/formatSavedAt";
import { getGroupContributors, getTopGroups } from "@/lib/aggregateEntries";
import { TOP_GROUPS_COUNT } from "@/lib/constants";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
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
        No saved summaries yet. Generate a summary, then tap{" "}
        <strong className="text-violet-300">Save summary</strong> to add it here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 pb-2">
      {rounds.map((round, index) => {
        const top = getTopGroups(round.groups, TOP_GROUPS_COUNT);
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
                {top.length} group{top.length === 1 ? "" : "s"}
                {summaryCount > 0
                  ? ` · ${summaryCount} summar${summaryCount === 1 ? "y" : "ies"}`
                  : ""}
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
  const topGroups = getTopGroups(snapshot.groups, TOP_GROUPS_COUNT);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <Button type="button" variant="ghost" onClick={onBack} className="w-fit px-4">
        ← Back to list
      </Button>
      <p className="text-xs text-zinc-500">{formatSavedAt(snapshot.savedAt)}</p>

      {topGroups.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {topGroups.map((g, i) => (
            <li
              key={g.group}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
            >
              <span className="font-semibold text-violet-300">#{i + 1}</span>{" "}
              <span className="capitalize">{g.group}</span>
              <span className="text-zinc-500"> · {g.count}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {snapshot.summaries.length > 0 ? (
        <p className="text-xs text-zinc-500">
          Tap a group card to see who contributed.
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {snapshot.summaries.map((card, index) => {
          const group =
            snapshot.groups.find((g) => g.group === card.group) ??
            topGroups.find((g) => g.group === card.group);
          const isExpanded = expandedGroup === card.group;
          const contributors = group ? getGroupContributors(group) : [];

          return (
            <motion.li
              key={`${card.group}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedGroup((prev) =>
                    prev === card.group ? null : card.group,
                  )
                }
                aria-expanded={isExpanded}
                className={`flex w-full flex-col rounded-2xl border p-4 text-left transition-colors ${
                  isExpanded
                    ? "border-violet-400/40 bg-violet-500/10"
                    : "border-white/10 bg-zinc-900/80 active:bg-zinc-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold capitalize text-violet-200">
                    {card.group}
                  </h3>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {isExpanded ? "Hide guests" : "Show guests"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                  {card.summary}
                </p>
                {group ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    {group.count} contribution{group.count === 1 ? "" : "s"}
                  </p>
                ) : null}

                {isExpanded && contributors.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                    {contributors.map((c, contributorIndex) => (
                      <li
                        key={`${c.name}-${contributorIndex}`}
                        className="rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-zinc-100">
                          {c.name}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                          {c.input}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </button>
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
