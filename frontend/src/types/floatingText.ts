export type FloatingTextVariant = "input" | "group";

export interface FloatingTextItem {
  id: string;
  label: string;
  variant: FloatingTextVariant;
  /** Optional subtitle (e.g. guest name on raw inputs). */
  meta?: string;
  /** Group name when variant is input and entry is classified. */
  group?: string;
  /** Phrase count — scales group pills by dominance on host Groups tab. */
  count?: number;
  hue: number;
}

export interface FloatingTextLayout {
  id: string;
  label: string;
  meta?: string;
  group?: string;
  variant: FloatingTextVariant;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  hue: number;
  count?: number;
  fontSize: number;
  dominanceRank: number;
}
