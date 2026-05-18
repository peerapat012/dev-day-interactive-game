"use client";

import { useMemo } from "react";
import type { BubbleItem } from "@/types/entry";

export interface BubbleLayout {
  id: string;
  x: number;
  y: number;
  size: number;
  label: string;
  count: number;
  hue: number;
}

function hashPair(a: string, b: string): number {
  let h = 0;
  const s = `${a}:${b}`;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Deterministic pseudo-random layout — stable across re-renders for the same ids.
 * Lightweight collision pass keeps bubbles from stacking on top of each other.
 */
export function useBubbleLayout(
  items: BubbleItem[],
  containerWidth: number,
  containerHeight: number,
  scaleSize: (count: number, max: number) => number,
): BubbleLayout[] {
  return useMemo(() => {
    if (!items.length || containerWidth <= 0 || containerHeight <= 0) {
      return [];
    }

    const maxCount = Math.max(...items.map((i) => i.count), 1);
    const placed: BubbleLayout[] = [];

    for (const item of items) {
      const size = scaleSize(item.count, maxCount);
      const seed = hashPair(item.id, "pos");
      let x = 8 + (seed % Math.max(1, containerWidth - size - 16));
      let y = 8 + ((seed >> 8) % Math.max(1, containerHeight - size - 16));

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const collision = placed.some((p) => {
          const dx = p.x + p.size / 2 - (x + size / 2);
          const dy = p.y + p.size / 2 - (y + size / 2);
          const minDist = (p.size + size) / 2 + 6;
          return dx * dx + dy * dy < minDist * minDist;
        });
        if (!collision) break;
        x = Math.min(
          containerWidth - size - 8,
          x + ((attempt % 3) + 1) * 14,
        );
        y = Math.min(
          containerHeight - size - 8,
          y + ((attempt % 2) + 1) * 12,
        );
      }

      placed.push({
        id: item.id,
        x,
        y,
        size,
        label: item.label,
        count: item.count,
        hue: item.hue,
      });
    }

    return placed;
  }, [items, containerWidth, containerHeight, scaleSize]);
}
