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

export interface GroupStat {
  group: string;
  count: number;
  inputs: string[];
}

export interface BubbleItem {
  id: string;
  label: string;
  count: number;
  hue: number;
}
