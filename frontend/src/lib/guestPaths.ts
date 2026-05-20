export const GUEST_PATH = "/guest";

export function isGuestPath(pathname: string): boolean {
  return pathname === GUEST_PATH || pathname.startsWith(`${GUEST_PATH}/`);
}
