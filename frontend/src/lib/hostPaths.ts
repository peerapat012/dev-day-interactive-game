export const HOST_PATH = "/host";
export const QUIZ_HOST_PATH = "/quiz/host";

export function isHostPath(pathname: string): boolean {
  return pathname === HOST_PATH || pathname.startsWith(`${HOST_PATH}/`);
}

export function isQuizHostPath(pathname: string): boolean {
  return pathname === QUIZ_HOST_PATH || pathname.startsWith(`${QUIZ_HOST_PATH}/`);
}
