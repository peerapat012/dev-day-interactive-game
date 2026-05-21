/** Bump when guest must see a blank room field (host closed room, leave, clear device). */
const RESET_EPOCH_KEY = "word-cloud-join-form-epoch";

export function readJoinFormEpoch(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(RESET_EPOCH_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function bumpJoinFormEpoch(): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = readJoinFormEpoch() + 1;
    window.sessionStorage.setItem(RESET_EPOCH_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

/** @deprecated Room draft caused stale codes to reappear; epoch reset replaces this. */
export function readGuestJoinRoomDraft(): string {
  return "";
}

export function writeGuestJoinRoomDraft(_value: string): void {
  /* no-op — do not persist typed room codes */
}

export function clearGuestJoinRoomDraft(): void {
  /* no-op */
}
