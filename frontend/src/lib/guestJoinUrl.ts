import { GUEST_PATH } from "@/lib/guestPaths";

export function buildGuestJoinUrl(roomId: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${GUEST_PATH}?room=${encodeURIComponent(roomId)}`;
}
