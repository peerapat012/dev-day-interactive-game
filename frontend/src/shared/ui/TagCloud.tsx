"use client";

import type { ContributorTag } from "@/lib/contributorTags";
import {
  GUEST_TAG_VARIANTS,
  guestTagVariantIndex,
} from "@/shared/ui/guestTagStyles";

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
          const variant = GUEST_TAG_VARIANTS[guestTagVariantIndex(tag.name)];

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
