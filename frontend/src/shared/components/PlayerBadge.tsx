"use client";

import Link from "next/link";
import { usePlayerStore } from "@/store/playerStore";

export function PlayerBadge() {
  const displayName = usePlayerStore((s) => s.displayName);

  if (!displayName.trim()) return null;

  return (
    <Link
      href="/lobby"
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm transition hover:border-violet-400/40 hover:bg-violet-500/10"
      title="Change nickname"
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/30 text-xs font-bold uppercase text-violet-200"
        aria-hidden
      >
        {displayName.slice(0, 1)}
      </span>
      <span className="max-w-[120px] truncate font-medium text-zinc-200">
        {displayName}
      </span>
    </Link>
  );
}
