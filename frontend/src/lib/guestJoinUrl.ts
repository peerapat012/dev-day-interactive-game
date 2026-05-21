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

/** In-app guest path with optional `?room=` (no origin). */
export function guestPathWithRoom(roomId: string): string {
  const code = normalizeRoomCode(roomId);
  if (!code) return GUEST_PATH;
  return `${GUEST_PATH}?room=${encodeURIComponent(code)}`;
}

export function buildGuestJoinUrl(roomId: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${guestPathWithRoom(roomId)}`;
}
