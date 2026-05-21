export interface EntryDocument {
  name: string;
  input: string;
  group: string;
  roomId: string;
  guestId: string;
  createdAt: string;
}

export interface Entry extends EntryDocument {
  $id: string;
}

export interface GroupContributor {
  name: string;
  input: string;
}

export interface GroupStat {
  group: string;
  count: number;
  inputs: string[];
  /** Guest name + phrase per classified entry (saved in summary history). */
  contributors?: GroupContributor[];
}

export interface BubbleItem {
  id: string;
  label: string;
  count: number;
  hue: number;
}
