"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { buildFloatingItemsFromEntries } from "@/lib/buildFloatingTextItems";
import { FloatingTextField } from "@/shared/components/floating-text/FloatingTextField";
import { useEntriesStore } from "@/store/entriesStore";

interface HostInputsTabProps {
  roomId: string;
}

export function HostInputsTab({ roomId }: HostInputsTabProps) {
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
        {roomEntries.length === 0
          ? "No guest phrases yet."
          : `${roomEntries.length} phrase${roomEntries.length === 1 ? "" : "s"} floating live`}
      </p>

      <FloatingTextField
        items={floatingItems}
        className="min-h-[min(60dvh,640px)] flex-1"
        emptyMessage="Waiting for guest input — phrases will appear here as floating text when guests submit."
      />
    </div>
  );
}
