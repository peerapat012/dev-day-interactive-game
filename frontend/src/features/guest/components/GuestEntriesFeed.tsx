"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { buildFloatingItemsFromEntries } from "@/lib/buildFloatingTextItems";
import { FloatingTextField } from "@/shared/components/floating-text/FloatingTextField";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";

export function GuestEntriesFeed() {
  const entries = useEntriesStore((s) => s.entries);
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const roomId = useRoomStore((s) => s.roomId);

  const sorted = useMemo(
    () => entries.filter((e) => e.roomId === roomId),
    [entries, roomId],
  );

  const floatingItems = useMemo(
    () => buildFloatingItemsFromEntries(sorted),
    [sorted],
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

  return (
    <FloatingTextField
      items={floatingItems}
      className="min-h-[min(45dvh,480px)] flex-1"
      emptyMessage="No phrases yet — be the first to send one, or wait for others to join."
    />
  );
}
