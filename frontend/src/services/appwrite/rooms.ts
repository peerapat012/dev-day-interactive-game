import { ID, Permission, Query, Role, TablesDB } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { deriveIsSummaryFromSummarizeJson } from "@/lib/hostSummaryState";
import { generateRoomCode } from "@/lib/roomCode";
import { getAppwriteClient } from "@/services/appwrite/client";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { resetGuestsSubmissionForRoom } from "@/services/appwrite/guests";
import type { Room, RoomDocument, RoomSnapshot, SavedRoundSnapshot } from "@/types/room";
import type { SummarizeResultItem } from "@/types/api";
import type { GroupStat } from "@/types/entry";

function getTablesDB(): TablesDB {
  return new TablesDB(getAppwriteClient());
}

function assertConfig(): void {
  if (!APPWRITE.databaseId || !APPWRITE.roomsTableId) {
    throw new Error(
      "Missing Appwrite env: NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_ROOMS_TABLE_ID",
    );
  }
}

/** True when Appwrite rejects an unknown `isSummary` attribute. */
function isUnknownIsSummaryAttributeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /isSummary/i.test(message) && /unknown|invalid|not found|attribute/i.test(message);
}

function withoutIsSummaryField<T extends { isSummary?: boolean }>(
  data: T,
): Omit<T, "isSummary"> {
  const next = { ...data };
  delete next.isSummary;
  return next;
}

async function createRoomRow(
  data: RoomDocument,
): Promise<Record<string, unknown>> {
  try {
    return (await getTablesDB().createRow({
      databaseId: APPWRITE.databaseId,
      tableId: APPWRITE.roomsTableId,
      rowId: ID.unique(),
      data,
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
    })) as unknown as Record<string, unknown>;
  } catch (error) {
    if (!isUnknownIsSummaryAttributeError(error)) throw error;
    return (await getTablesDB().createRow({
      databaseId: APPWRITE.databaseId,
      tableId: APPWRITE.roomsTableId,
      rowId: ID.unique(),
      data: withoutIsSummaryField(data),
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
    })) as unknown as Record<string, unknown>;
  }
}

async function updateRoomRow(
  roomRowId: string,
  patch: Partial<RoomDocument>,
): Promise<Record<string, unknown>> {
  try {
    return (await getTablesDB().updateRow({
      databaseId: APPWRITE.databaseId,
      tableId: APPWRITE.roomsTableId,
      rowId: roomRowId,
      data: patch,
    })) as unknown as Record<string, unknown>;
  } catch (error) {
    if (!("isSummary" in patch) || !isUnknownIsSummaryAttributeError(error)) {
      throw error;
    }
    return (await getTablesDB().updateRow({
      databaseId: APPWRITE.databaseId,
      tableId: APPWRITE.roomsTableId,
      rowId: roomRowId,
      data: withoutIsSummaryField(patch),
    })) as unknown as Record<string, unknown>;
  }
}

function mapRoom(row: Record<string, unknown>): Room {
  const summarizeJson = (row.summarizeJson as string) ?? "[]";
  const isSummary =
    typeof row.isSummary === "boolean"
      ? row.isSummary
      : deriveIsSummaryFromSummarizeJson(summarizeJson);

  return {
    $id: row.$id as string,
    roomId: row.roomId as string,
    groupsJson: (row.groupsJson as string) ?? "[]",
    summarizeJson,
    savedSnapshotsJson: (row.savedSnapshotsJson as string) ?? "[]",
    isSummary,
    lastSavedAt: (row.lastSavedAt as string) || undefined,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

function parseSavedSnapshots(raw: string): SavedRoundSnapshot[] {
  try {
    return JSON.parse(raw || "[]") as SavedRoundSnapshot[];
  } catch {
    return [];
  }
}

function parseSnapshot(room: Room): RoomSnapshot {
  let groups: GroupStat[] = [];
  let summaries: SummarizeResultItem[] = [];
  try {
    groups = JSON.parse(room.groupsJson || "[]") as GroupStat[];
  } catch {
    groups = [];
  }
  try {
    summaries = JSON.parse(room.summarizeJson || "[]") as SummarizeResultItem[];
  } catch {
    summaries = [];
  }
  return {
    groups,
    summaries,
    isSummary: room.isSummary || summaries.length > 0,
  };
}

export async function getRoomByCode(roomId: string): Promise<Room | null> {
  await ensureGuestSession();
  assertConfig();

  const result = await getTablesDB().listRows({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.roomsTableId,
    queries: [Query.equal("roomId", roomId), Query.limit(1)],
  });

  const row = result.rows[0];
  if (!row) return null;
  return mapRoom(row as unknown as Record<string, unknown>);
}

export async function createRoom(): Promise<Room> {
  await ensureGuestSession();
  assertConfig();

  const now = new Date().toISOString();
  let roomId = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await getRoomByCode(roomId);
    if (!existing) break;
    roomId = generateRoomCode();
  }

  const data: RoomDocument = {
    roomId,
    groupsJson: "[]",
    summarizeJson: "[]",
    savedSnapshotsJson: "[]",
    isSummary: false,
    createdAt: now,
    updatedAt: now,
  };

  const row = await createRoomRow(data);
  return mapRoom(row);
}

export async function updateRoomSnapshot(
  roomRowId: string,
  snapshot: Partial<{
    groups: GroupStat[];
    summaries: SummarizeResultItem[];
    savedSnapshots: SavedRoundSnapshot[];
    lastSavedAt: string | null;
    isSummary: boolean;
  }>,
): Promise<Room> {
  await ensureGuestSession();
  assertConfig();

  const patch: Partial<RoomDocument> = {
    updatedAt: new Date().toISOString(),
  };
  if (snapshot.groups) {
    patch.groupsJson = JSON.stringify(snapshot.groups);
  }
  if (snapshot.summaries) {
    patch.summarizeJson = JSON.stringify(snapshot.summaries);
    patch.isSummary = snapshot.summaries.length > 0;
  }
  if (snapshot.savedSnapshots) {
    patch.savedSnapshotsJson = JSON.stringify(snapshot.savedSnapshots);
  }
  if (snapshot.lastSavedAt !== undefined) {
    patch.lastSavedAt = snapshot.lastSavedAt ?? undefined;
  }
  if (snapshot.isSummary !== undefined) {
    patch.isSummary = snapshot.isSummary;
  }

  const row = await updateRoomRow(roomRowId, patch);
  return mapRoom(row);
}

/** Persist summary + groups to DB and append to saved history. */
export async function saveRoomRound(
  roomRowId: string,
  payload: {
    groups: GroupStat[];
    summaries: SummarizeResultItem[];
  },
): Promise<Room> {
  await ensureGuestSession();
  assertConfig();

  const row = await getTablesDB().getRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.roomsTableId,
    rowId: roomRowId,
  });
  const room = mapRoom(row as unknown as Record<string, unknown>);
  const history = parseSavedSnapshots(room.savedSnapshotsJson);
  const savedAt = new Date().toISOString();

  history.push({
    savedAt,
    groups: payload.groups,
    summaries: payload.summaries,
  });

  return updateRoomSnapshot(roomRowId, {
    groups: payload.groups,
    summaries: payload.summaries,
    savedSnapshots: history,
    lastSavedAt: savedAt,
  });
}

/**
 * End the session: deletes the room row (no extra Appwrite columns).
 * Joins fail (`getRoomByCode` → null); guests are kicked on the next poll.
 */
export async function closeRoomSession(roomRowId: string): Promise<void> {
  await ensureGuestSession();
  assertConfig();

  await getTablesDB().deleteRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.roomsTableId,
    rowId: roomRowId,
  });
}

export async function getRoomSnapshot(roomRowId: string): Promise<RoomSnapshot> {
  await ensureGuestSession();
  assertConfig();

  const row = await getTablesDB().getRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.roomsTableId,
    rowId: roomRowId,
  });

  return parseSnapshot(mapRoom(row as unknown as Record<string, unknown>));
}

export async function getSavedRounds(roomRowId: string): Promise<SavedRoundSnapshot[]> {
  await ensureGuestSession();
  assertConfig();

  const row = await getTablesDB().getRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.roomsTableId,
    rowId: roomRowId,
  });

  const room = mapRoom(row as unknown as Record<string, unknown>);
  return parseSavedSnapshots(room.savedSnapshotsJson);
}

async function deleteAllInTable(
  tableId: string,
  queries: string[],
): Promise<void> {
  const db = getTablesDB();
  let cursor: string | undefined;

  for (;;) {
    const batch = await db.listRows({
      databaseId: APPWRITE.databaseId,
      tableId,
      queries: [
        ...queries,
        Query.limit(100),
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ],
    });

    if (!batch.rows.length) break;

    await Promise.all(
      batch.rows.map((row) =>
        db.deleteRow({
          databaseId: APPWRITE.databaseId,
          tableId,
          rowId: row.$id,
        }),
      ),
    );

    if (batch.rows.length < 100) break;
    cursor = batch.rows[batch.rows.length - 1]?.$id;
  }
}

/** Clear active round data but keep room + saved history. Guests can submit again. */
export async function startNewRound(roomId: string, roomRowId: string): Promise<void> {
  await ensureGuestSession();
  assertConfig();

  if (APPWRITE.collectionId) {
    await deleteAllInTable(APPWRITE.collectionId, [
      Query.equal("roomId", roomId),
    ]);
  }

  await resetGuestsSubmissionForRoom(roomId);

  await updateRoomSnapshot(roomRowId, {
    groups: [],
    summaries: [],
    isSummary: false,
  });
}

/**
 * Same-room reset for host: wipes phrases + room snapshots + saved-round history,
 * resets all guests `hasSubmitted` so they can send again without scanning QR again.
 */
export async function clearRoomRows(roomId: string): Promise<void> {
  await ensureGuestSession();
  assertConfig();

  if (APPWRITE.collectionId) {
    await deleteAllInTable(APPWRITE.collectionId, [
      Query.equal("roomId", roomId),
    ]);
  }

  await resetGuestsSubmissionForRoom(roomId);

  const room = await getRoomByCode(roomId);
  if (room) {
    await updateRoomSnapshot(room.$id, {
      groups: [],
      summaries: [],
      savedSnapshots: [],
      lastSavedAt: null,
      isSummary: false,
    });
  }
}
