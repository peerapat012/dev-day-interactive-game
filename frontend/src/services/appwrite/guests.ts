import { ID, Permission, Query, Role, TablesDB } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { getAppwriteClient } from "@/services/appwrite/client";
import { ensureGuestSession } from "@/services/appwrite/auth";
import type { Guest, GuestDocument } from "@/types/room";

function getTablesDB(): TablesDB {
  return new TablesDB(getAppwriteClient());
}

function assertConfig(): void {
  if (!APPWRITE.databaseId || !APPWRITE.guestsTableId) {
    throw new Error(
      "Missing Appwrite env: NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_GUESTS_TABLE_ID",
    );
  }
}

function mapGuest(row: Record<string, unknown>): Guest {
  return {
    $id: row.$id as string,
    guestUuid: row.guestUuid as string,
    displayName: row.displayName as string,
    roomId: row.roomId as string,
    hasSubmitted: Boolean(row.hasSubmitted),
    createdAt: row.createdAt as string,
  };
}

export async function getGuest(guestUuid: string): Promise<Guest | null> {
  await ensureGuestSession();
  assertConfig();

  try {
    const row = await getTablesDB().getRow({
      databaseId: APPWRITE.databaseId,
      tableId: APPWRITE.guestsTableId,
      rowId: guestUuid,
    });
    return mapGuest(row as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function createGuest(
  roomId: string,
  displayName: string,
): Promise<Guest> {
  await ensureGuestSession();
  assertConfig();

  const guestUuid = ID.unique();
  const data: GuestDocument = {
    guestUuid,
    displayName: displayName.trim(),
    roomId,
    hasSubmitted: false,
    createdAt: new Date().toISOString(),
  };

  const row = await getTablesDB().createRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.guestsTableId,
    rowId: guestUuid,
    data,
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
  });

  return mapGuest(row as unknown as Record<string, unknown>);
}

export async function markGuestSubmitted(guestUuid: string): Promise<Guest> {
  await ensureGuestSession();
  assertConfig();

  const row = await getTablesDB().updateRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.guestsTableId,
    rowId: guestUuid,
    data: { hasSubmitted: true },
  });

  return mapGuest(row as unknown as Record<string, unknown>);
}

/** True if guest row is flagged or an entry already exists for this guest. */
export async function guestHasSubmitted(
  roomId: string,
  guestUuid: string,
): Promise<boolean> {
  const guest = await getGuest(guestUuid);
  if (!guest) {
    throw new Error("Guest session expired. Rejoin the room to play again.");
  }
  if (!APPWRITE.collectionId) return guest.hasSubmitted;

  const result = await getTablesDB().listRows({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.collectionId,
    queries: [
      Query.equal("roomId", roomId),
      Query.equal("guestId", guestUuid),
      Query.limit(1),
    ],
  });

  if (result.total > 0) return true;
  return false;
}

export async function resetGuestsSubmissionForRoom(roomId: string): Promise<void> {
  await ensureGuestSession();
  assertConfig();

  const guests = await listGuestsByRoom(roomId);
  if (!guests.length) return;

  const db = getTablesDB();
  await Promise.all(
    guests.map((guest) =>
      db.updateRow({
        databaseId: APPWRITE.databaseId,
        tableId: APPWRITE.guestsTableId,
        rowId: guest.guestUuid,
        data: { hasSubmitted: false },
      }),
    ),
  );
}

export async function listGuestsByRoom(roomId: string): Promise<Guest[]> {
  await ensureGuestSession();
  assertConfig();

  const result = await getTablesDB().listRows({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.guestsTableId,
    queries: [
      Query.equal("roomId", roomId),
      Query.orderDesc("createdAt"),
      Query.limit(500),
    ],
  });

  return result.rows.map((row) =>
    mapGuest(row as unknown as Record<string, unknown>),
  );
}
