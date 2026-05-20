"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useClassifyGroups } from "@/features/game/hooks/useClassifyGroups";
import { buildGroupBubbles } from "@/lib/aggregateEntries";
import { BubbleField } from "@/shared/components/bubble/BubbleField";
import { Button } from "@/shared/ui/Button";

export function HostGroupsTab() {
  const {
    groups,
    loading,
    error,
    isHydrated,
    pendingCount,
    classifiedCount,
    entryCount,
    runClassify,
    roomId,
  } = useClassifyGroups();

  const bubbles = useMemo(() => buildGroupBubbles(groups), [groups]);
  const hasGroups = groups.length > 0;

  return (
    <motion.div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          {entryCount === 0 ? (
            "Waiting for guest submissions…"
          ) : hasGroups ? (
            <>
              {classifiedCount} classified phrase
              {classifiedCount === 1 ? "" : "s"} · {groups.length} group
              {groups.length === 1 ? "" : "s"}
              {pendingCount > 0
                ? ` · ${pendingCount} still pending`
                : null}
            </>
          ) : (
            <>
              {entryCount} submission{entryCount === 1 ? "" : "s"} · none grouped
              yet
              {pendingCount > 0
                ? ` (${pendingCount} pending)`
                : null}
            </>
          )}
        </p>

        <Button
          type="button"
          onClick={() => void runClassify()}
          disabled={loading || pendingCount === 0 || !roomId}
          className="w-full shrink-0 px-6 py-3 sm:w-auto"
        >
          {loading
            ? "Classifying…"
            : pendingCount === 0
              ? "All classified"
              : hasGroups
                ? "Classify pending"
                : "Classify"}
        </Button>
      </div>

      {!isHydrated ? (
        <StatusPanel>Loading from database…</StatusPanel>
      ) : null}

      {isHydrated && entryCount === 0 ? (
        <StatusPanel>
          Share the guest QR link so players can join and send phrases.
        </StatusPanel>
      ) : null}

      {loading ? (
        <StatusPanel>
          <motion.div
            className="mb-4 h-10 w-10 rounded-full border-2 border-violet-400 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          Classifying pending submissions…
        </StatusPanel>
      ) : null}

      {error && !loading ? (
        <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {!loading && isHydrated && hasGroups ? (
        <>
          <ul className="flex flex-wrap gap-2">
            {groups.map((group, index) => (
              <li
                key={group.group}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300"
              >
                <span className="font-semibold text-violet-300">#{index + 1}</span>
                <span className="font-medium capitalize">{group.group}</span>
                <span className="text-zinc-500">· {group.count}</span>
              </li>
            ))}
          </ul>
          <BubbleField
            items={bubbles}
            className="min-h-[min(55dvh,560px)] flex-1"
          />
        </>
      ) : null}

      {!loading && isHydrated && entryCount > 0 && !hasGroups && !error ? (
        <StatusPanel>
          No grouped submissions in the database yet. Press{" "}
          <strong className="text-violet-300">Classify</strong> to assign groups to
          pending phrases.
        </StatusPanel>
      ) : null}
    </motion.div>
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
