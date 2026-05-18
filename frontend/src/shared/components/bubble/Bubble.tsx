"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { scaleFontSize } from "@/lib/bubbleScale";

export interface BubbleProps {
  id: string;
  label: string;
  count: number;
  maxCount: number;
  x: number;
  y: number;
  size: number;
  hue: number;
  onClick?: () => void;
}

function BubbleComponent({
  label,
  count,
  maxCount,
  x,
  y,
  size,
  hue,
  onClick,
}: BubbleProps) {
  const fontSize = scaleFontSize(count, maxCount);

  return (
    <motion.button
      type="button"
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={onClick}
      className="absolute flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full border border-white/15 text-center font-medium text-white shadow-lg backdrop-blur-md active:scale-95"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        fontSize,
        background: `hsla(${hue}, 70%, 45%, 0.35)`,
        boxShadow: `0 8px 32px hsla(${hue}, 80%, 50%, 0.25)`,
      }}
      aria-label={`${label}, ${count} items`}
    >
      <span className="max-w-[90%] truncate px-1 leading-tight">{label}</span>
    </motion.button>
  );
}

export const Bubble = memo(BubbleComponent);
