"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { BubbleField } from "@/shared/components/bubble/BubbleField";
import { buildRawBubbles } from "@/lib/aggregateEntries";
import { useEntriesStore } from "@/store/entriesStore";

export function RawWordCloud() {
  const entries = useEntriesStore((s) => s.entries);
  const isHydrated = useEntriesStore((s) => s.isHydrated);

  const bubbles = useMemo(() => buildRawBubbles(entries), [entries]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50 text-sm text-zinc-500">
        Loading cloud…
      </div>
    );
  }

  if (!bubbles.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[320px] flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/30 text-sm text-zinc-500"
      >
        Submit text to see floating inputs appear here.
      </motion.div>
    );
  }

  return <BubbleField items={bubbles} className="min-h-[min(60vh,520px)]" />;
}
