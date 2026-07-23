"use client";

import type { ContributorTag } from "@/lib/contributorTags";
import {
  GUEST_TAG_VARIANTS,
  guestTagVariantIndex,
} from "@/shared/ui/guestTagStyles";

/** Guest chip with name, contribution count, and quoted inputs. */
export function GuestContributorChip({ tag }: { tag: ContributorTag }) {
  const variant = GUEST_TAG_VARIANTS[guestTagVariantIndex(tag.name)];

  return (
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
  );
}

interface GuestContributorListProps {
  tags: ContributorTag[];
  /** Accessible label for the list. */
  "aria-label"?: string;
}

export function GuestContributorList({
  tags,
  "aria-label": ariaLabel = "Guests",
}: GuestContributorListProps) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={ariaLabel}>
      {tags.map((tag) => (
        <li key={tag.name} className="max-w-full">
          <GuestContributorChip tag={tag} />
        </li>
      ))}
    </ul>
  );
}
