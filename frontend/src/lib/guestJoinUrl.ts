import { GUEST_PATH } from "@/lib/guestPaths";
import { normalizeRoomCode } from "@/lib/roomCode";

/** Read room code from guest join URL query (`?room=` or `?roomId=`). */
export function roomCodeFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): string {
  return normalizeRoomCode(
    searchParams.get("room") ?? searchParams.get("roomId") ?? "",
  );
}

export function buildGuestJoinUrl(roomId: string, origin?: string): string {
  const code = normalizeRoomCode(roomId);
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${GUEST_PATH}?room=${encodeURIComponent(code)}`;
}
