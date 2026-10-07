"use client";

import { useState } from "react";
import type { ContributorTag } from "@/lib/contributorTags";
import {
  GuestContributorChip,
  GuestContributorList,
} from "@/shared/ui/GuestContributorChip";
import { Modal } from "@/shared/ui/Modal";

/** Max guest chips shown inline before Show more (history Guests section). */
export const MAX_VISIBLE_GUEST_TAGS = 3;

interface TagCloudProps {
  tags: ContributorTag[];
  /** Uppercase section label, e.g. "Guests". */
  label?: string;
  emptyMessage?: string;
  /**
   * When set, only this many chips render inline and Show more opens a modal
   * with the full list (always shown when there is at least one guest).
   */
  maxVisible?: number;
}

export function TagCloud({
  tags,
  label = "Guests",
  emptyMessage = "No guests recorded for this group.",
  maxVisible,
}: TagCloudProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (tags.length === 0) {
    return <p className="mt-3 text-xs text-fg-muted">{emptyMessage}</p>;
  }

  const truncate = maxVisible != null;
  const visibleTags = truncate ? tags.slice(0, maxVisible) : tags;

  return (
    <>
      <div className="mt-4 border-t border-line pt-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {label}
        </p>
        <p className="mb-2.5 text-[11px] leading-relaxed text-fg-muted">
          <span className="text-fg-muted">(n)</span> = number of phrases that guest
          submitted in this group. Inputs are shown below each name.
        </p>
        <ul className="flex flex-wrap items-end gap-2" aria-label={label}>
          {visibleTags.map((tag) => (
            <li key={tag.name} className="max-w-full">
              <GuestContributorChip tag={tag} />
            </li>
          ))}
          {truncate ? (
            <li>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="relative inline-flex min-h-[28px] items-center rounded-full border border-line-strong bg-surface px-2.5 py-0.5 text-xs font-medium text-fg-secondary transition-[transform,background-color,color,border-color] duration-150 ease-out after:absolute after:-inset-2 after:content-[''] hover:border-line-strong hover:bg-surface-hover hover:text-fg active:scale-[0.96]"
              >
                Show more
              </button>
            </li>
          ) : null}
        </ul>
      </div>

      {truncate ? (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={label}
          elevated
        >
          <p className="mb-3 text-[11px] leading-relaxed text-fg-muted">
            <span className="text-fg-muted">(n)</span> = number of phrases that
            guest submitted in this group. Inputs are shown below each name.
          </p>
          <GuestContributorList tags={tags} aria-label={`All ${label}`} />
          <p className="mt-4 text-xs text-fg-muted">
            {tags.length} guest{tags.length === 1 ? "" : "s"}
          </p>
        </Modal>
      ) : null}
    </>
  );
}
