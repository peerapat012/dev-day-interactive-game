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
}
