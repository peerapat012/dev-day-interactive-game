"use client";

import { useMemo } from "react";
import {
  collisionGapForGroup,
  estimateGroupPillDimensions,
} from "@/lib/floatingGroupScale";
import type { FloatingTextItem, FloatingTextLayout } from "@/types/floatingText";

const MIN_GAP = 12;
const FIELD_PADDING = 12;
/** Collision box slightly larger than visual pill. */
const COLLISION_INSET = 1.1;

function hashPair(a: string, b: string): number {
  let h = 0;
  const s = `${a}:${b}`;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function rotationForId(id: string): number {
  const h = hashPair(id, "rot");
  return -8 + (h % 17);
}

function sortByDominance(items: FloatingTextItem[]): FloatingTextItem[] {
  return [...items].sort((a, b) => {
    const ca = a.variant === "group" ? (a.count ?? 0) : 0;
    const cb = b.variant === "group" ? (b.count ?? 0) : 0;
    if (cb !== ca) return cb - ca;
    return a.label.localeCompare(b.label);
  });
}

function estimateInputPillSize(label: string, item: FloatingTextItem) {
  const chars = Math.min(label.length, 48);
  const width = Math.min(280, Math.max(96, chars * 9 + 36));
  let height = 48;
  if (item.meta) height += 16;
  if (item.group) height += 14;
  return { width, height, fontSize: 15, ratio: 0 };
}

function layoutCollisionSize(width: number, height: number) {
  return {
    width: Math.ceil(width * COLLISION_INSET),
    height: Math.ceil(height * COLLISION_INSET),
  };
}

/** Axis-aligned bounds of a rotated rectangle (top-left anchor). */
function collisionRect(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
): { x: number; y: number; width: number; height: number } {
  const rad = (Math.abs(rotation) * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const boxW = width * cos + height * sin;
  const boxH = width * sin + height * cos;
  const cx = x + width / 2;
  const cy = y + height / 2;
  return {
    x: cx - boxW / 2,
    y: cy - boxH / 2,
    width: boxW,
    height: boxH,
  };
}

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  gap: number,
): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

function collidesWithPlaced(
  x: number,
  y: number,
  layoutW: number,
  layoutH: number,
  rotation: number,
  placed: FloatingTextLayout[],
  gap: number,
): boolean {
  const candidate = collisionRect(x, y, layoutW, layoutH, rotation);
  return placed.some((p) => {
    const col = layoutCollisionSize(p.width, p.height);
    const other = collisionRect(
      p.x,
      p.y,
      col.width,
      col.height,
      p.rotation,
    );
    return rectsOverlap(candidate, other, gap);
  });
}

function spiralCandidates(
  seed: number,
  maxX: number,
  maxY: number,
  step: number,
): { x: number; y: number }[] {
  const spreadX = Math.max(1, maxX - FIELD_PADDING);
  const spreadY = Math.max(1, maxY - FIELD_PADDING);
  const startX = FIELD_PADDING + (seed % spreadX);
  const startY = FIELD_PADDING + ((seed >> 8) % spreadY);
  const out: { x: number; y: number }[] = [{ x: startX, y: startY }];

  for (let ring = 1; ring <= 60; ring += 1) {
    const offset = ring * step;
    out.push(
      { x: Math.min(maxX, startX + offset), y: startY },
      { x: Math.max(FIELD_PADDING, startX - offset), y: startY },
      { x: startX, y: Math.min(maxY, startY + offset) },
      { x: startX, y: Math.max(FIELD_PADDING, startY - offset) },
      {
        x: Math.min(maxX, startX + offset * 0.7),
        y: Math.min(maxY, startY + offset * 0.7),
      },
      {
        x: Math.max(FIELD_PADDING, startX - offset * 0.7),
        y: Math.max(FIELD_PADDING, startY - offset * 0.7),
      },
    );
  }

  return out;
}

function gridCandidatesFromCenter(
  maxX: number,
  maxY: number,
  step: number,
  containerWidth: number,
  containerHeight: number,
): { x: number; y: number }[] {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const list: { x: number; y: number; sortKey: number }[] = [];

  for (let y = FIELD_PADDING; y <= maxY; y += step) {
    for (let x = FIELD_PADDING; x <= maxX; x += step) {
      const dx = x - centerX;
      const dy = y - centerY;
      list.push({ x, y, sortKey: dx * dx + dy * dy });
    }
  }

  list.sort((a, b) => a.sortKey - b.sortKey);
  return list;
}

function findPosition(
  width: number,
  height: number,
  rotation: number,
  containerWidth: number,
  containerHeight: number,
  placed: FloatingTextLayout[],
  seed: number,
  gap: number,
  options?: { centerBias?: number },
): { x: number; y: number } {
  const col = layoutCollisionSize(width, height);
  const maxX = Math.max(
    FIELD_PADDING,
    containerWidth - col.width - FIELD_PADDING,
  );
  const maxY = Math.max(
    FIELD_PADDING,
    containerHeight - col.height - FIELD_PADDING,
  );
  const step = Math.max(
    24,
    Math.max(col.width, col.height) * 0.4 + MIN_GAP,
  );

  const tryPosition = (x: number, y: number) => {
    const clampedX = Math.min(maxX, Math.max(FIELD_PADDING, x));
    const clampedY = Math.min(maxY, Math.max(FIELD_PADDING, y));
    if (
      !collidesWithPlaced(
        clampedX,
        clampedY,
        col.width,
        col.height,
        rotation,
        placed,
        gap,
      )
    ) {
      return { x: clampedX, y: clampedY };
    }
    return null;
  };

  const bias = options?.centerBias ?? 0;
  if (bias > 0) {
    const cx = (containerWidth - width) / 2;
    const cy = (containerHeight - height) / 2;
    const hit = tryPosition(
      cx * bias + (FIELD_PADDING + (seed % 40)) * (1 - bias),
      cy * bias + (FIELD_PADDING + ((seed >> 4) % 40)) * (1 - bias),
    );
    if (hit) return hit;
  }

  for (const pos of spiralCandidates(seed, maxX, maxY, step)) {
    const hit = tryPosition(pos.x, pos.y);
    if (hit) return hit;
  }

  for (const pos of gridCandidatesFromCenter(
    maxX,
    maxY,
    step,
    containerWidth,
    containerHeight,
  )) {
    const hit = tryPosition(pos.x, pos.y);
    if (hit) return hit;
  }

  const rowW = col.width + gap + 8;
  const rowH = col.height + gap + 8;
  return {
    x: Math.min(maxX, FIELD_PADDING + (placed.length % 5) * rowW),
    y: Math.min(maxY, FIELD_PADDING + Math.floor(placed.length / 5) * rowH),
  };
}

/**
 * Scatter pills with rotation-aware collision avoidance (largest groups first).
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

      const size = isGroup
        ? estimateGroupPillDimensions(item.label, count, maxGroupCount, {
            hasMeta: Boolean(item.meta),
          })
        : estimateInputPillSize(item.label, item);

      const { width, height, fontSize, ratio } = size;

      if (isGroup) {
        dominanceRank += 1;
      }

      const rotation = rotationForId(item.id);
      const seed = hashPair(item.id, "pos");
      const gap = isGroup ? collisionGapForGroup(ratio) : MIN_GAP + 6;
      const centerBias = isGroup ? 0.25 + ratio * 0.65 : 0;

      const { x, y } = findPosition(
        width,
        height,
        rotation,
        containerWidth,
        containerHeight,
        placed,
        seed,
        gap,
        { centerBias },
      );

      const rank = isGroup ? dominanceRank : 0;
      const zIndex = isGroup
        ? 300 - rank
        : 40 + (ordered.length - placed.length);

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
        rotation,
        hue: item.hue,
        count: isGroup ? count : undefined,
        fontSize,
        dominanceRank: rank,
        zIndex,
      });
    }

    return placed;
  }, [items, containerWidth, containerHeight]);
}
