export const ENTRIES_CHANGED_EVENT = "word-cloud:entries-changed";

/** Ask all mounted clients to refetch entries for this room (e.g. after submit). */
export function notifyEntriesChanged(roomId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ENTRIES_CHANGED_EVENT, { detail: { roomId } }),
  );
}
