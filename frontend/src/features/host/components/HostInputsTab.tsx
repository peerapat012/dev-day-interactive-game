"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { isClassifiedEntry } from "@/lib/aggregateEntries";
import { useEntriesStore } from "@/store/entriesStore";

interface HostInputsTabProps {
  roomId: string;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function HostInputsTab({ roomId }: HostInputsTabProps) {
  const entries = useEntriesStore((s) => s.entries);
  const isHydrated = useEntriesStore((s) => s.isHydrated);

  const sorted = useMemo(
    () =>
      [...entries]
        .filter((e) => e.roomId === roomId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [entries, roomId],
  );

  if (!isHydrated) {
    return (
      <motion.div
        className="flex min-h-[40dvh] items-center justify-center text-sm text-zinc-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Loading submissions…
      </motion.div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <p className="text-sm text-zinc-400">
        {sorted.length === 0
          ? "No guest phrases yet."
          : `${sorted.length} phrase${sorted.length === 1 ? "" : "s"} from guests`}
      </p>

      {sorted.length === 0 ? (
        <motion.div
          className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-4xl" aria-hidden>
            💬
          </p>
          <p className="mt-4 text-base font-medium text-zinc-300">
            Waiting for guest input
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Phrases appear here when guests submit from the Room tab link.
          </p>
        </motion.div>
      ) : (
        <ul className="flex max-h-[min(60dvh,640px)] flex-col gap-2 overflow-y-auto pb-2">
          {sorted.map((entry, index) => {
            const grouped = isClassifiedEntry(entry);
            return (
              <motion.li
                key={entry.$id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <article className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-300">
                      {entry.name}
                    </span>
                    <time
                      className="shrink-0 text-xs text-zinc-500"
                      dateTime={entry.createdAt}
                    >
                      {formatTime(entry.createdAt)}
                    </time>
                  </div>
                  <p className="break-words text-base text-zinc-100">
                    {entry.input}
                  </p>
                  {grouped ? (
                    <p className="mt-2 text-xs capitalize text-violet-400/90">
                      Group: {entry.group}
                    </p>
                  ) : null}
                </article>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
