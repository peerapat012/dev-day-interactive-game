"use client";

import Link from "next/link";
import { usePlayerStore } from "@/store/playerStore";

export function PlayerBadge() {
  const displayName = usePlayerStore((s) => s.displayName);

  if (!displayName.trim()) return null;

  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm transition-[background-color,border-color] duration-150 ease-out hover:border-primary/40 hover:bg-primary/10"
      title="Change nickname"
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/30 text-xs font-bold uppercase text-primary-text"
        aria-hidden
      >
        {displayName.slice(0, 1)}
      </span>
      <span className="max-w-[120px] truncate font-medium text-fg-secondary">
        {displayName}
      </span>
    </Link>
  );
}
