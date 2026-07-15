import type { GroupStat } from "@/types/entry";
import type { SummarizeResultItem } from "@/types/api";

export interface GuestDocument {
  guestUuid: string;
  displayName: string;
  roomId: string;
  hasSubmitted: boolean;
  createdAt: string;
}

export interface Guest extends GuestDocument {
  $id: string;
}

export interface SavedRoundSnapshot {
  savedAt: string;
  groups: GroupStat[];
  summaries: SummarizeResultItem[];
}

export interface RoomDocument {
  roomId: string;
  groupsJson: string;
  summarizeJson: string;
  savedSnapshotsJson: string;
  /**
   * True when the room has an active saved summary (`summarizeJson` non-empty).
   * Prefer a real Appwrite boolean attribute on the rooms table. If the column
   * is missing, writers omit the field and readers derive it from summarizeJson.
   */
  isSummary: boolean;
  lastSavedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room extends RoomDocument {
  $id: string;
}

export interface RoomSnapshot {
  groups: GroupStat[];
  summaries: SummarizeResultItem[];
  isSummary: boolean;
}
