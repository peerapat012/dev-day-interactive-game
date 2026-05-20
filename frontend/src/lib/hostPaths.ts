export const HOST_PATH = "/host";

export function isHostPath(pathname: string): boolean {
  return pathname === HOST_PATH || pathname.startsWith(`${HOST_PATH}/`);
}
