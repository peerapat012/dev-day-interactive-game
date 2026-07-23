import type { ContributorTag } from "@/lib/contributorTags";
import {
  GUEST_TAG_VARIANTS,
  guestTagVariantIndex,
} from "@/shared/ui/guestTagStyles";

interface GuestNameBubblesProps {
  tags: ContributorTag[];
}

/** Compact name-only chips for summary topic cards. Renders nothing when empty. */
export function GuestNameBubbles({ tags }: GuestNameBubblesProps) {
  if (tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Guests">
      {tags.map((tag) => {
        const variant = GUEST_TAG_VARIANTS[guestTagVariantIndex(tag.name)];

        return (
          <li key={tag.name}>
            <span
              className={`inline-block max-w-full truncate rounded-full border px-2.5 py-0.5 text-xs font-medium ${variant.bg} ${variant.text} ${variant.border}`}
            >
              {tag.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
