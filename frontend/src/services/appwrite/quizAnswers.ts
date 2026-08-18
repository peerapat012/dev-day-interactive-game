import { ID, Permission, Query, Role, TablesDB } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { getAppwriteClient } from "@/services/appwrite/client";
import { ensureGuestSession } from "@/services/appwrite/auth";
import type { QuizAnswer } from "@/types/quiz";

function getTablesDB(): TablesDB {
  return new TablesDB(getAppwriteClient());
}

function assertConfig(): void {
  if (!APPWRITE.databaseId || !APPWRITE.answersTableId) {
    throw new Error(
      "Missing Appwrite env: NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_ANSWERS_TABLE_ID",
    );
  }
}

function mapAnswer(row: Record<string, unknown>): QuizAnswer {
  return {
    $id: row.$id as string,
    roomId: row.roomId as string,
    questionId: row.questionId as string,
    guestId: row.guestId as string,
    guestUuid: row.guestUuid as string,
    selectedOptionId: row.selectedOption as string,
    answeredAt: row.answeredAt as string,
    isCorrect: Boolean(row.isCorrect),
    points: (row.points as number) ?? 0,
  };
}

export async function answerExists(
  roomId: string,
  questionId: string,
  guestUuid: string,
): Promise<boolean> {
  await ensureGuestSession();
  assertConfig();

  const result = await getTablesDB().listRows({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.answersTableId,
    queries: [
      Query.equal("roomId", roomId),
      Query.equal("questionId", questionId),
      Query.equal("guestUuid", guestUuid),
      Query.limit(1),
    ],
  });

  return result.total > 0;
}

/**
 * Persist one answer per guest per question. Returns null when an answer
 * already exists for this guest + question (mirrors `guestHasSubmitted`).
 */
export async function createAnswer(
  data: Omit<QuizAnswer, "$id">,
): Promise<QuizAnswer | null> {
  await ensureGuestSession();
  assertConfig();

  const already = await answerExists(data.roomId, data.questionId, data.guestUuid);
  if (already) return null;

  const row = await getTablesDB().createRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.answersTableId,
    rowId: ID.unique(),
    data: {
      roomId: data.roomId,
      questionId: data.questionId,
      guestId: data.guestId,
      guestUuid: data.guestUuid,
      selectedOption: data.selectedOptionId,
      answeredAt: data.answeredAt,
      isCorrect: data.isCorrect,
      points: data.points,
      createdAt: new Date().toISOString(),
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
  });

  return mapAnswer(row as unknown as Record<string, unknown>);
}

export async function listAnswersByRoom(roomId: string): Promise<QuizAnswer[]> {
  await ensureGuestSession();
  assertConfig();

  const result = await getTablesDB().listRows({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.answersTableId,
    queries: [
      Query.equal("roomId", roomId),
      Query.limit(5000),
    ],
  });

  return result.rows.map((row) =>
    mapAnswer(row as unknown as Record<string, unknown>),
  );
}

/** Delete every answer row for a room so a fresh quiz starts from zero. */
export async function clearAnswersByRoom(roomId: string): Promise<void> {
  await ensureGuestSession();
  assertConfig();

  const db = getTablesDB();
  let cursor: string | undefined;

  for (;;) {
    const batch = await db.listRows({
      databaseId: APPWRITE.databaseId,
      tableId: APPWRITE.answersTableId,
      queries: [
        Query.equal("roomId", roomId),
        Query.limit(100),
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ],
    });

    if (!batch.rows.length) break;

    await Promise.all(
      batch.rows.map((row) =>
        db.deleteRow({
          databaseId: APPWRITE.databaseId,
          tableId: APPWRITE.answersTableId,
          rowId: row.$id,
        }),
      ),
    );

    if (batch.rows.length < 100) break;
    cursor = batch.rows[batch.rows.length - 1]?.$id;
  }
}