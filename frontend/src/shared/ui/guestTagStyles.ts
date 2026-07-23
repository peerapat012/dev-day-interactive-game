export const GUEST_TAG_VARIANTS = [
  {
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-200/90",
    muted: "text-rose-700/80",
  },
  {
    bg: "bg-zinc-200",
    text: "text-zinc-700",
    border: "border-zinc-300/90",
    muted: "text-zinc-600/90",
  },
  {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-200/90",
    muted: "text-emerald-700/80",
  },
  {
    bg: "bg-sky-100",
    text: "text-sky-800",
    border: "border-sky-200/90",
    muted: "text-sky-700/80",
  },
  {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-200/90",
    muted: "text-amber-800/80",
  },
  {
    bg: "bg-violet-100",
    text: "text-violet-800",
    border: "border-violet-200/90",
    muted: "text-violet-700/80",
  },
  {
    bg: "bg-fuchsia-100",
    text: "text-fuchsia-800",
    border: "border-fuchsia-200/90",
    muted: "text-fuchsia-700/80",
  },
  {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    border: "border-cyan-200/90",
    muted: "text-cyan-700/80",
  },
] as const;

export function guestTagVariantIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % GUEST_TAG_VARIANTS.length;
}
