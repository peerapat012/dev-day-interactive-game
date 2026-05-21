const DRAFT_KEY = "word-cloud-join-room-draft";

export function readGuestJoinRoomDraft(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeGuestJoinRoomDraft(value: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!value.trim()) {
      window.sessionStorage.removeItem(DRAFT_KEY);
      return;
    }
    window.sessionStorage.setItem(DRAFT_KEY, value);
  } catch {
    /* private mode / quota */
  }
}

export function clearGuestJoinRoomDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
