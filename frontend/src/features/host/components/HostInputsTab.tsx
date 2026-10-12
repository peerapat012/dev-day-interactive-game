"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { buildFloatingItemsFromEntries } from "@/lib/buildFloatingTextItems";
import { RoundQuestionEditor } from "@/features/host/components/RoundQuestionEditor";
import { FloatingTextField } from "@/shared/components/floating-text/FloatingTextField";
import { useEntriesStore } from "@/store/entriesStore";

interface HostInputsTabProps {
  roomId: string;
  roomRowId: string;
  question: string;
  onQuestionSaved: (question: string) => void;
}

export function HostInputsTab({
  roomId,
  roomRowId,
  question,
  onQuestionSaved,
}: HostInputsTabProps) {
  const entries = useEntriesStore((s) => s.entries);
  const isHydrated = useEntriesStore((s) => s.isHydrated);

  const roomEntries = useMemo(
    () => entries.filter((e) => e.roomId === roomId),
    [entries, roomId],
  );

  const floatingItems = useMemo(
    () => buildFloatingItemsFromEntries(roomEntries),
    [roomEntries],
  );

  if (!isHydrated) {
    return (
      <motion.div
        className="flex min-h-[40dvh] items-center justify-center text-sm text-fg-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Loading submissions…
      </motion.div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface py-1.5 pl-4 pr-1.5">
        <div className="flex min-w-0 flex-1 basis-[16rem]">
          <RoundQuestionEditor
            roomRowId={roomRowId}
            question={question}
            onSaved={onQuestionSaved}
            variant="compact"
          />
        </div>
        <p
          className="flex shrink-0 items-center gap-2 pr-3 text-sm text-fg-secondary tabular-nums"
          aria-live="polite"
        >
          <span
            className={`size-2 rounded-full ${roomEntries.length ? "bg-success" : "bg-fg-muted/50"}`}
            aria-hidden
          />
          {roomEntries.length === 0
            ? "No phrases yet"
            : `${roomEntries.length} phrase${roomEntries.length === 1 ? "" : "s"} live`}
        </p>
      </div>

      <FloatingTextField
        items={floatingItems}
        className="min-h-[min(60dvh,640px)] flex-1"
        emptyMessage="Waiting for guest input — phrases will appear here as floating text when guests submit."
      />
    </div>
  );
}
