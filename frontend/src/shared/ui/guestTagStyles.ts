export const GUEST_TAG_VARIANTS = [
  {
    bg: "bg-rose-100 dark:bg-rose-500/15",
    text: "text-rose-800 dark:text-rose-200",
    border: "border-rose-200/90 dark:border-rose-400/25",
    muted: "text-rose-700/80 dark:text-rose-300/80",
  },
  {
    bg: "bg-zinc-200 dark:bg-zinc-500/15",
    text: "text-zinc-700 dark:text-zinc-200",
    border: "border-zinc-300/90 dark:border-zinc-400/25",
    muted: "text-zinc-600/90 dark:text-zinc-300/80",
  },
  {
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-200/90 dark:border-emerald-400/25",
    muted: "text-emerald-700/80 dark:text-emerald-300/80",
  },
  {
    bg: "bg-sky-100 dark:bg-sky-500/15",
    text: "text-sky-800 dark:text-sky-200",
    border: "border-sky-200/90 dark:border-sky-400/25",
    muted: "text-sky-700/80 dark:text-sky-300/80",
  },
  {
    bg: "bg-amber-100 dark:bg-amber-500/15",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-200/90 dark:border-amber-400/25",
    muted: "text-amber-800/80 dark:text-amber-300/80",
  },
  {
    bg: "bg-violet-100 dark:bg-violet-500/15",
    text: "text-violet-800 dark:text-violet-200",
    border: "border-violet-200/90 dark:border-violet-400/25",
    muted: "text-violet-700/80 dark:text-violet-300/80",
  },
  {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-500/15",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    border: "border-fuchsia-200/90 dark:border-fuchsia-400/25",
    muted: "text-fuchsia-700/80 dark:text-fuchsia-300/80",
  },
  {
    bg: "bg-cyan-100 dark:bg-cyan-500/15",
    text: "text-cyan-800 dark:text-cyan-200",
    border: "border-cyan-200/90 dark:border-cyan-400/25",
    muted: "text-cyan-700/80 dark:text-cyan-300/80",
  },
] as const;

export function guestTagVariantIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % GUEST_TAG_VARIANTS.length;
}
