/** Rooms columns the app tolerates being absent from the deployed Appwrite schema. */
export const OPTIONAL_ROOM_COLUMNS = ["isSummary", "roundQuestion"] as const;
export type OptionalRoomColumn = (typeof OPTIONAL_ROOM_COLUMNS)[number];

/** Optional columns that Appwrite rejected as unknown/invalid in this error. */
export function findUnknownOptionalColumns(error: unknown): OptionalRoomColumn[] {
  const message = error instanceof Error ? error.message : String(error);
  if (!/unknown|invalid|not found|attribute/i.test(message)) return [];
  return OPTIONAL_ROOM_COLUMNS.filter((column) => message.includes(column));
}

export function withoutColumns<T extends object>(
  data: T,
  columns: readonly string[],
): Partial<T> {
  const next = { ...data } as Record<string, unknown>;
  columns.forEach((column) => delete next[column]);
  return next as Partial<T>;
}
