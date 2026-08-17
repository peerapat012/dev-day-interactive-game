import { ID, Permission, Query, Role, TablesDB } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { getAppwriteClient } from "@/services/appwrite/client";
import { getAccount } from "@/services/appwrite/auth";
import type { QuestionDeck, QuizQuestion } from "@/types/quiz";

const LOCAL_DECK_KEY = "word-cloud-quiz-deck";

function getTablesDB(): TablesDB {
  return new TablesDB(getAppwriteClient());
}

function assertConfig(): void {
  if (!APPWRITE.databaseId || !APPWRITE.questionDecksTableId) {
    throw new Error(
      "Missing Appwrite env: NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_QUESTION_DECKS_TABLE_ID",
    );
  }
}

function parseDeck(raw: string | null | undefined): QuestionDeck | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QuestionDeck;
    if (!parsed || !Array.isArray(parsed.questions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Unauthenticated host: keep the deck in localStorage (wiped by Clear session). */
export function saveLocalDeck(deck: QuestionDeck): void {
  localStorage.setItem(LOCAL_DECK_KEY, JSON.stringify(deck));
}

export function loadLocalDeck(): QuestionDeck | null {
  return parseDeck(localStorage.getItem(LOCAL_DECK_KEY));
}

export function clearLocalDeck(): void {
  localStorage.removeItem(LOCAL_DECK_KEY);
}

export interface SavedQuestionDeck {
  $id: string;
  name: string;
  questions: QuizQuestion[];
  ownerId: string;
  createdAt: string;
}

function mapDeckRow(row: Record<string, unknown>): SavedQuestionDeck {
  const parsed = parseDeck((row.questionsJson as string) ?? "");
  return {
    $id: row.$id as string,
    name: (row.name as string) ?? "Untitled deck",
    questions: parsed?.questions ?? [],
    ownerId: row.ownerId as string,
    createdAt: row.createdAt as string,
  };
}

export async function getCurrentUserId(): Promise<string> {
  const account = getAccount();
  const user = await account.get();
  return user.$id;
}

/** Authenticated host: persist a reusable deck owned by the account user. */
export async function createQuestionDeck(
  deck: QuestionDeck,
): Promise<SavedQuestionDeck> {
  assertConfig();
  const ownerId = await getCurrentUserId();

  const row = await getTablesDB().createRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.questionDecksTableId,
    rowId: ID.unique(),
    data: {
      ownerId,
      name: deck.name,
      questionsJson: JSON.stringify(deck),
      createdAt: new Date().toISOString(),
    },
    permissions: [
      Permission.read(Role.user(ownerId)),
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
    ],
  });

  return mapDeckRow(row as unknown as Record<string, unknown>);
}

export async function listMyDecks(): Promise<SavedQuestionDeck[]> {
  assertConfig();
  const ownerId = await getCurrentUserId();

  const result = await getTablesDB().listRows({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.questionDecksTableId,
    queries: [
      Query.equal("ownerId", ownerId),
      Query.orderDesc("createdAt"),
      Query.limit(100),
    ],
  });

  return result.rows.map((row) =>
    mapDeckRow(row as unknown as Record<string, unknown>),
  );
}

export async function deleteQuestionDeck(rowId: string): Promise<void> {
  assertConfig();
  await getTablesDB().deleteRow({
    databaseId: APPWRITE.databaseId,
    tableId: APPWRITE.questionDecksTableId,
    rowId,
  });
}