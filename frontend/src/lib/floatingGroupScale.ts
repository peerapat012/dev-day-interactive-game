/** Size range for group dominance pills on the host Groups tab. */
export const FLOATING_GROUP = {
  minWidth: 100,
  maxWidth: 320,
  minHeight: 52,
  maxHeight: 120,
  minFont: 13,
  maxFont: 32,
} as const;

/** Matches FloatingTextPill group padding: `0.65em 1.1em`. */
export const GROUP_PILL_PADDING_EM = { y: 0.65, x: 1.1 } as const;

const META_FONT_PX = 10;
const META_GAP_PX = 4;

/**
 * 0 = smallest group, 1 = top group (same count as max in room).
 * Linear vs max so size steps are visible relative to the leader.
 */
export function groupDominanceRatio(count: number, maxCount: number): number {
  if (maxCount <= 0 || count <= 0) return 0;
  return Math.min(1, count / maxCount);
}

export function scaleGroupPillWidth(count: number, maxCount: number): number {
  const r = groupDominanceRatio(count, maxCount);
  return Math.round(
    FLOATING_GROUP.minWidth + r * (FLOATING_GROUP.maxWidth - FLOATING_GROUP.minWidth),
  );
}

export function scaleGroupPillHeight(count: number, maxCount: number): number {
  const r = groupDominanceRatio(count, maxCount);
  return Math.round(
    FLOATING_GROUP.minHeight + r * (FLOATING_GROUP.maxHeight - FLOATING_GROUP.minHeight),
  );
}

export function scaleGroupFontSize(count: number, maxCount: number): number {
  const r = groupDominanceRatio(count, maxCount);
  return Math.round(
    FLOATING_GROUP.minFont + r * (FLOATING_GROUP.maxFont - FLOATING_GROUP.minFont),
  );
}

/**
 * Layout box sized to match rendered group pills (font + em padding + meta line).
 * Used for collision so large/small groups do not overlap.
 */
export function estimateGroupPillDimensions(
  label: string,
  count: number,
  maxCount: number,
  options?: { hasMeta?: boolean },
): {
  width: number;
  height: number;
  fontSize: number;
  ratio: number;
} {
  const ratio = groupDominanceRatio(count, maxCount);
  const fontSize = scaleGroupFontSize(count, maxCount);
  const padX = fontSize * GROUP_PILL_PADDING_EM.x * 2;
  const padY = fontSize * GROUP_PILL_PADDING_EM.y * 2;
  const labelLine = fontSize * 1.3;
  const metaBlock = options?.hasMeta ? META_FONT_PX + META_GAP_PX : 0;
  const textWidth = Math.min(label.length, 48) * (fontSize * 0.58);
  const scaledW = scaleGroupPillWidth(count, maxCount);
  const scaledH = scaleGroupPillHeight(count, maxCount);

  return {
    fontSize,
    ratio,
    width: Math.round(Math.max(scaledW, textWidth + padX)),
    height: Math.round(Math.max(scaledH, padY + labelLine + metaBlock)),
  };
}

/** Extra collision margin — larger pills need more clearance. */
export function collisionGapForGroup(ratio: number): number {
  return Math.round(12 + ratio * 18);
}
