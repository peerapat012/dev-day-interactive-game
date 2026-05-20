"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useEntriesStore } from "@/store/entriesStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";
import type { Entry } from "@/types/entry";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isOwnEntry(entryName: string, displayName: string): boolean {
  return entryName.trim().toLowerCase() === displayName.trim().toLowerCase();
}

function sortNewestFirst(entries: Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function GuestEntriesFeed() {
  const entries = useEntriesStore((s) => s.entries);
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const displayName = usePlayerStore((s) => s.displayName);
  const roomId = useRoomStore((s) => s.roomId);

  const sorted = useMemo(
    () => sortNewestFirst(entries.filter((e) => e.roomId === roomId)),
    [entries, roomId],
  );

  if (!isHydrated) {
    return (
      <motion.div
        className="flex flex-1 items-center justify-center py-12 text-sm text-zinc-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Loading phrases…
      </motion.div>
    );
  }

  if (!sorted.length) {
    return (
      <motion.div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-4xl" aria-hidden>
          💬
        </p>
        <p className="mt-4 text-base font-medium text-zinc-300">
          No phrases yet
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Be the first to send one, or wait for others to join.
        </p>
      </motion.div>
    );
  }

  return (
    <ul className="flex flex-col gap-2 pb-2">
      {sorted.map((entry, index) => {
        const mine = isOwnEntry(entry.name, displayName);
        return (
          <motion.li
            key={entry.$id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3) }}
          >
            <article
              className={`rounded-2xl border px-4 py-3 ${
                mine
                  ? "border-violet-500/40 bg-violet-500/10"
                  : "border-white/10 bg-zinc-900/60"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span
                  className={`truncate text-sm font-semibold ${
                    mine ? "text-violet-200" : "text-zinc-300"
                  }`}
                >
                  {mine ? "You" : entry.name}
                </span>
                <time
                  className="shrink-0 text-xs text-zinc-500"
                  dateTime={entry.createdAt}
                >
                  {formatTime(entry.createdAt)}
                </time>
              </div>
              <p className="break-words text-base text-zinc-100">{entry.input}</p>
            </article>
          </motion.li>
        );
      })}
    </ul>
  );
}
