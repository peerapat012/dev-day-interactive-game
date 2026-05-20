/** Size range for group dominance pills on the host Groups tab. */
export const FLOATING_GROUP = {
  minWidth: 96,
  maxWidth: 300,
  minHeight: 44,
  maxHeight: 100,
  minFont: 13,
  maxFont: 30,
} as const;

export function groupDominanceRatio(count: number, maxCount: number): number {
  if (maxCount <= 0 || count <= 0) return 0;
  return Math.sqrt(count / maxCount);
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
