import { BUBBLE } from "@/lib/constants";

export function scaleBubbleSize(count: number, maxCount: number): number {
  if (maxCount <= 0) return BUBBLE.minSize;
  const ratio = Math.sqrt(count / maxCount);
  return Math.round(BUBBLE.minSize + ratio * (BUBBLE.maxSize - BUBBLE.minSize));
}

export function scaleFontSize(count: number, maxCount: number): number {
  if (maxCount <= 0) return BUBBLE.minFont;
  const ratio = Math.sqrt(count / maxCount);
  return Math.round(BUBBLE.minFont + ratio * (BUBBLE.maxFont - BUBBLE.minFont));
}
