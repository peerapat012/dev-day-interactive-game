"use client";

import type { ContributorTag } from "@/lib/contributorTags";

const TAG_VARIANTS = [
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

function variantIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % TAG_VARIANTS.length;
}

interface TagCloudProps {
  tags: ContributorTag[];
  /** Uppercase section label, e.g. "Guests". */
  label?: string;
  emptyMessage?: string;
}

export function TagCloud({
  tags,
  label = "Guests",
  emptyMessage = "No guests recorded for this group.",
}: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <p className="mt-3 text-xs text-zinc-500">{emptyMessage}</p>
    );
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mb-2.5 text-[11px] leading-relaxed text-zinc-500">
        <span className="text-zinc-400">(n)</span> = number of phrases that guest
        submitted in this group. Inputs are shown below each name.
      </p>
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const variant = TAG_VARIANTS[variantIndex(tag.name)];

          return (
            <li key={tag.name} className="max-w-full">
              <div
                className={`inline-flex max-w-full flex-col gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium leading-snug ${variant.bg} ${variant.text} ${variant.border}`}
              >
                <span>
                  <span className="font-semibold">{tag.name}</span>
                  <span className="opacity-80"> ({tag.count})</span>
                </span>
                <ul className={`flex flex-col gap-0.5 font-normal ${variant.muted}`}>
                  {tag.inputs.map((input, i) => (
                    <li key={`${tag.name}-${i}`} className="break-words">
                      &ldquo;{input}&rdquo;
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
