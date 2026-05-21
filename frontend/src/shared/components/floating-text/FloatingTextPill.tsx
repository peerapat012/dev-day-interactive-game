"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { GROUP_PILL_PADDING_EM } from "@/lib/floatingGroupScale";
import type { FloatingTextVariant } from "@/types/floatingText";

export interface FloatingTextPillProps {
  label: string;
  meta?: string;
  group?: string;
  variant: FloatingTextVariant;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  hue: number;
  fontSize?: number;
  count?: number;
  dominanceRank?: number;
  index?: number;
  zIndex?: number;
}

function FloatingTextPillComponent({
  label,
  meta,
  group,
  variant,
  x,
  y,
  width,
  height,
  rotation,
  hue,
  fontSize = 15,
  count = 0,
  dominanceRank = 0,
  index = 0,
  zIndex = 1,
}: FloatingTextPillProps) {
  const isGroup = variant === "group";
  const isTopGroup = isGroup && dominanceRank === 1;

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, rotate: rotation - 4 }}
      animate={{ scale: 1, opacity: 1, rotate: rotation }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 28,
        delay: Math.min(index * 0.03, 0.2),
      }}
      className="pointer-events-none absolute flex items-center justify-center"
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex,
      }}
      aria-label={
        isGroup && count > 0
          ? `${label}, ${count} phrases`
          : label
      }
    >
      <div
        className={`flex h-full w-full flex-col items-center justify-center rounded-full border text-center shadow-lg backdrop-blur-md ${
          isGroup
            ? isTopGroup
              ? "border-violet-200/50 bg-violet-500/25"
              : "border-violet-200/35 bg-violet-500/15"
            : "border-white/25 bg-white/[0.08]"
        }`}
        style={{
          padding: isGroup
            ? `${GROUP_PILL_PADDING_EM.y}em ${GROUP_PILL_PADDING_EM.x}em`
            : "0.5em 1em",
          boxSizing: "border-box",
          boxShadow: isTopGroup
            ? `0 12px 40px hsla(${hue}, 70%, 50%, 0.35), inset 0 1px 0 rgba(255,255,255,0.18)`
            : `0 8px 32px hsla(${hue}, 65%, 45%, 0.2), inset 0 1px 0 rgba(255,255,255,0.12)`,
        }}
      >
        <span
          className={`max-w-full truncate font-bold leading-tight ${
            isGroup
              ? "capitalize text-[#f8ead8]"
              : "font-semibold normal-case text-[#f5e6d8]"
          }`}
          style={{ fontSize: isGroup ? fontSize : Math.min(fontSize, 16) }}
          title={label}
        >
          {label}
        </span>
        {meta ? (
          <span className="mt-0.5 max-w-full truncate text-[10px] font-medium uppercase tracking-wide text-white/45">
            {meta}
          </span>
        ) : null}
        {group && !isGroup ? (
          <span className="mt-0.5 max-w-full truncate text-[10px] capitalize text-violet-300/80">
            {group}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

export const FloatingTextPill = memo(FloatingTextPillComponent);
