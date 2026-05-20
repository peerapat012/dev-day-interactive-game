"use client";

import { useMemo } from "react";
import {
  groupDominanceRatio,
  scaleGroupFontSize,
  scaleGroupPillHeight,
  scaleGroupPillWidth,
} from "@/lib/floatingGroupScale";
import type { FloatingTextItem, FloatingTextLayout } from "@/types/floatingText";

function hashPair(a: string, b: string): number {
  let h = 0;
  const s = `${a}:${b}`;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function estimateInputPillSize(label: string) {
  const chars = Math.min(label.length, 48);
  const width = Math.min(280, Math.max(88, chars * 9 + 32));
  return { width, height: 44, fontSize: 15 };
}

function estimateGroupPillSize(
  label: string,
  count: number,
  maxCount: number,
): { width: number; height: number; fontSize: number } {
  const scaledW = scaleGroupPillWidth(count, maxCount);
  const scaledH = scaleGroupPillHeight(count, maxCount);
  const chars = Math.min(label.length, 32);
  const labelMinW = Math.max(96, chars * 10 + 36);
  return {
    width: Math.max(scaledW, labelMinW),
    height: scaledH,
    fontSize: scaleGroupFontSize(count, maxCount),
  };
}

function rotationForId(id: string): number {
  const h = hashPair(id, "rot");
  return -14 + (h % 29);
}

function sortByDominance(items: FloatingTextItem[]): FloatingTextItem[] {
  return [...items].sort((a, b) => {
    const ca = a.variant === "group" ? (a.count ?? 0) : 0;
    const cb = b.variant === "group" ? (b.count ?? 0) : 0;
    if (cb !== ca) return cb - ca;
    return a.label.localeCompare(b.label);
  });
}

/**
 * Scatter pills in the field with light collision avoidance (stable per id).
 * Group items are laid out largest-first so dominant topics read clearly.
 */
export function useFloatingTextLayout(
  items: FloatingTextItem[],
  containerWidth: number,
  containerHeight: number,
): FloatingTextLayout[] {
  return useMemo(() => {
    if (!items.length || containerWidth <= 0 || containerHeight <= 0) {
      return [];
    }

    const groupCounts = items
      .filter((i) => i.variant === "group" && (i.count ?? 0) > 0)
      .map((i) => i.count ?? 0);
    const maxGroupCount = groupCounts.length
      ? Math.max(...groupCounts)
      : 1;

    const ordered = sortByDominance(items);
    const placed: FloatingTextLayout[] = [];
    let dominanceRank = 0;

    for (const item of ordered) {
      const isGroup = item.variant === "group";
      const count = item.count ?? 1;

      const { width, height, fontSize } = isGroup
        ? estimateGroupPillSize(item.label, count, maxGroupCount)
        : estimateInputPillSize(item.label);

      if (isGroup) {
        dominanceRank += 1;
      }

      const seed = hashPair(item.id, "pos");
      const maxX = Math.max(8, containerWidth - width - 8);
      const maxY = Math.max(8, containerHeight - height - 8);

      // Bias larger (dominant) groups toward the visual center
      const centerBias = isGroup ? groupDominanceRatio(count, maxGroupCount) * 0.35 : 0;
      const centerX = (containerWidth - width) / 2;
      const centerY = (containerHeight - height) / 2;
      const spreadX = Math.max(1, maxX - 8);
      const spreadY = Math.max(1, maxY - 8);
      let x =
        centerX * centerBias +
        (8 + (seed % spreadX)) * (1 - centerBias);
      let y =
        centerY * centerBias +
        (8 + ((seed >> 8) % spreadY)) * (1 - centerBias);

      const pad = isGroup ? 14 + Math.floor(groupDominanceRatio(count, maxGroupCount) * 8) : 10;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const collision = placed.some((p) => {
          return !(
            x + width + pad < p.x ||
            p.x + p.width + pad < x ||
            y + height + pad < p.y ||
            p.y + p.height + pad < y
          );
        });
        if (!collision) break;
        x = Math.min(maxX, x + 20 + (attempt % 4) * 14);
        y = Math.min(maxY, y + 16 + (attempt % 3) * 12);
      }

      placed.push({
        id: item.id,
        label: item.label,
        meta: item.meta,
        group: item.group,
        variant: item.variant,
        x,
        y,
        width,
        height,
        rotation: rotationForId(item.id),
        hue: item.hue,
        count: isGroup ? count : undefined,
        fontSize,
        dominanceRank: isGroup ? dominanceRank : 0,
      });
    }

    return placed;
  }, [items, containerWidth, containerHeight]);
}
