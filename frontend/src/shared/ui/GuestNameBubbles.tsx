"use client";

import { useState } from "react";
import type { ContributorTag } from "@/lib/contributorTags";
import { GuestContributorList } from "@/shared/ui/GuestContributorChip";
import { Modal } from "@/shared/ui/Modal";
import {
  GUEST_TAG_VARIANTS,
  guestTagVariantIndex,
} from "@/shared/ui/guestTagStyles";

/** Max guest name bubbles shown on a summary topic card. */
export const MAX_VISIBLE_GUEST_BUBBLES = 3;

interface GuestNameBubblesProps {
  tags: ContributorTag[];
}

function GuestNameChip({ name }: { name: string }) {
  const variant = GUEST_TAG_VARIANTS[guestTagVariantIndex(name)];

  return (
    <span
      className={`inline-block max-w-full truncate rounded-full border px-2.5 py-0.5 text-xs font-medium ${variant.bg} ${variant.text} ${variant.border}`}
    >
      {name}
    </span>
  );
}

/** Compact name-only chips for summary topic cards. Renders nothing when empty. */
export function GuestNameBubbles({ tags }: GuestNameBubblesProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (tags.length === 0) return null;

  const visibleTags = tags.slice(0, MAX_VISIBLE_GUEST_BUBBLES);

  return (
    <>
      <ul className="flex flex-wrap items-center gap-1.5" aria-label="Guests">
        {visibleTags.map((tag) => (
          <li key={tag.name}>
            <GuestNameChip name={tag.name} />
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="relative inline-flex min-h-[28px] items-center rounded-full border border-line-strong bg-surface px-2.5 py-0.5 text-xs font-medium text-fg-secondary transition-[transform,background-color,color,border-color] duration-150 ease-out after:absolute after:-inset-2 after:content-[''] hover:border-line-strong hover:bg-surface-hover hover:text-fg active:scale-[0.96]"
          >
            Show more
          </button>
        </li>
      </ul>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Guests"
        elevated
      >
        <p className="mb-3 text-[11px] leading-relaxed text-fg-muted">
          <span className="text-fg-muted">(n)</span> = number of phrases that guest
          submitted in this group. Inputs are shown below each name.
        </p>
        <GuestContributorList tags={tags} aria-label="All guests" />
        <p className="mt-4 text-xs text-fg-muted">
          {tags.length} guest{tags.length === 1 ? "" : "s"}
        </p>
      </Modal>
    </>
  );
}
