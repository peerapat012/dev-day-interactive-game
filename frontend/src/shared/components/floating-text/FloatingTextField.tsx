"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FloatingTextPill } from "@/shared/components/floating-text/FloatingTextPill";
import { useFloatingTextLayout } from "@/shared/hooks/useFloatingTextLayout";
import type { FloatingTextItem } from "@/types/floatingText";

interface FloatingTextFieldProps {
  items: FloatingTextItem[];
  className?: string;
  emptyMessage?: string;
}

export function FloatingTextField({
  items,
  className = "",
  emptyMessage = "Nothing to show yet.",
}: FloatingTextFieldProps) {
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

  const layout = useFloatingTextLayout(items, size.w, size.h);

  if (!items.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex min-h-[320px] flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-gradient-to-br from-violet-950/40 via-indigo-950/50 to-zinc-950/80 px-6 text-center text-sm text-zinc-500 ${className}`}
      >
        {emptyMessage}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={`relative min-h-[320px] flex-1 overflow-hidden rounded-3xl border border-white/10 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-950/90 via-indigo-950/85 to-slate-950/95"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-20 top-1/4 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute left-1/3 top-8 h-2 w-2 rounded-full bg-cyan-300/40 blur-[1px]" />
        <div className="absolute right-1/4 top-1/3 h-1.5 w-1.5 rounded-full bg-white/30 blur-[0.5px]" />
        <div className="absolute bottom-1/3 left-1/4 h-1 w-1 rounded-full bg-violet-200/50" />
      </div>

      {layout.map((pill, index) => (
        <FloatingTextPill
          key={pill.id}
          label={pill.label}
          meta={pill.meta}
          group={pill.group}
          variant={pill.variant}
          x={pill.x}
          y={pill.y}
          width={pill.width}
          height={pill.height}
          rotation={pill.rotation}
          hue={pill.hue}
          fontSize={pill.fontSize}
          count={pill.count}
          dominanceRank={pill.dominanceRank}
          index={index}
        />
      ))}
    </motion.div>
  );
}
