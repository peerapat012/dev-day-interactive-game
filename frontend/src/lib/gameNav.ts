export const GAME_NAV = [
  { href: "/", label: "Cloud", mobileLabel: "Cloud" },
  { href: "/summary", label: "Summary", mobileLabel: "Summary" },
] as const;

export const GAME_PATHS = GAME_NAV.map((item) => item.href);

export function isGamePath(pathname: string): boolean {
  return GAME_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)),
  );
}
