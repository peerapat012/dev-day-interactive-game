import { ID, Permission, Query, Role, TablesDB } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { getAppwriteClient } from "@/services/appwrite/client";
import { ensureGuestSession } from "@/services/appwrite/auth";
import type { Entry, EntryDocument } from "@/types/entry";

function getTablesDB(): TablesDB {
  return new TablesDB(getAppwriteClient());
}

function assertConfig(): void {
  if (!APPWRITE.databaseId || !APPWRITE.collectionId) {
    throw new Error(
      "Missing Appwrite env: NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_COLLECTION_ID",
    );
  }
}

function mapRow(row: Record<string, unknown>): Entry {
  return {
    $id: row.$id as string,
    name: row.name as string,
    input: row.input as string,
    group: row.group as string,
    createdAt: row.createdAt as string,
  };
}

/** Create a classified entry (guest session required). */
export async function createEntry(data: EntryDocument): Promise<Entry> {
  await ensureGuestSession();
  assertConfig();

  const row = await getTablesDB().createRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.collectionId,
    rowId: ID.unique(),
    data,
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
  });

  return mapRow(row as unknown as Record<string, unknown>);
}

/** List all entries (paginated). */
export async function listEntries(limit = 500): Promise<Entry[]> {
  await ensureGuestSession();
  assertConfig();

  const result = await getTablesDB().listRows({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.collectionId,
    queries: [Query.orderDesc("createdAt"), Query.limit(limit)],
  });

  return result.rows.map((row) =>
    mapRow(row as unknown as Record<string, unknown>),
  );
}

/** Fetch entries for a normalized group. */
export async function listEntriesByGroup(group: string): Promise<Entry[]> {
  await ensureGuestSession();
  assertConfig();

  const result = await getTablesDB().listRows({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.collectionId,
    queries: [
      Query.equal("group", group),
      Query.orderDesc("createdAt"),
      Query.limit(500),
    ],
  });

  return result.rows.map((row) =>
    mapRow(row as unknown as Record<string, unknown>),
  );
}

/** Delete entry by id (example CRUD). */
export async function deleteEntry(rowId: string): Promise<void> {
  await ensureGuestSession();
  assertConfig();

  await getTablesDB().deleteRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.collectionId,
    rowId,
  });
}
