"use client";

import { useState } from "react";
import type { ContributorTag } from "@/lib/contributorTags";
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
            className="inline-flex min-h-[28px] items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-300 transition-[transform,background-color,color,border-color] duration-150 ease-out hover:border-white/25 hover:bg-white/10 hover:text-zinc-100 active:scale-[0.96]"
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
        <ul className="flex flex-wrap gap-1.5" aria-label="All guests">
          {tags.map((tag) => (
            <li key={tag.name}>
              <GuestNameChip name={tag.name} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-zinc-500">
          {tags.length} guest{tags.length === 1 ? "" : "s"}
        </p>
      </Modal>
    </>
  );
}
