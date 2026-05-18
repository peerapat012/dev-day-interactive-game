"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bubble } from "@/shared/components/bubble/Bubble";
import { useBubbleLayout } from "@/shared/hooks/useBubbleLayout";
import { scaleBubbleSize } from "@/lib/bubbleScale";
import type { BubbleItem } from "@/types/entry";

interface BubbleFieldProps {
  items: BubbleItem[];
  onBubbleClick?: (item: BubbleItem) => void;
  className?: string;
}

export function BubbleField({ items, onBubbleClick, className = "" }: BubbleFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scaleFn = useCallback(scaleBubbleSize, []);
  const layout = useBubbleLayout(items, size.w, size.h, scaleFn);
  const maxCount = useMemo(
    () => Math.max(...items.map((i) => i.count), 1),
    [items],
  );

  return (
    <motion.div
      ref={ref}
      className={`relative min-h-[320px] flex-1 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 ${className}`}
    >
      {layout.map((bubble) => {
        const item = items.find((i) => i.id === bubble.id);
        return (
          <Bubble
            key={bubble.id}
            id={bubble.id}
            label={bubble.label}
            count={bubble.count}
            maxCount={maxCount}
            x={bubble.x}
            y={bubble.y}
            size={bubble.size}
            hue={bubble.hue}
            onClick={item && onBubbleClick ? () => onBubbleClick(item) : undefined}
          />
        );
      })}
    </motion.div>
  );
}
