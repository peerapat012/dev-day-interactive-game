import { GUEST_PATH } from "@/lib/guestPaths";
import { HOST_PATH } from "@/lib/hostPaths";

export const GAME_NAV = [
  { href: HOST_PATH, label: "Host", mobileLabel: "Host" },
  { href: GUEST_PATH, label: "Guest", mobileLabel: "Guest" },
] as const;

export const GAME_PATHS = GAME_NAV.map((item) => item.href);

/** Legacy routes from the pre-room app — redirect to host. */
export const LEGACY_GAME_PATHS = ["/summary"] as const;

export function isGamePath(pathname: string): boolean {
  return GAME_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isLegacyGamePath(pathname: string): boolean {
  return LEGACY_GAME_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
