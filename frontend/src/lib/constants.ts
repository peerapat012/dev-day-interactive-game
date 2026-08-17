export const APPWRITE = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "",
  collectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID ?? "",
  guestsTableId:
    process.env.NEXT_PUBLIC_APPWRITE_GUESTS_TABLE_ID ?? "guests",
  roomsTableId: process.env.NEXT_PUBLIC_APPWRITE_ROOMS_TABLE_ID ?? "rooms",
  answersTableId:
    process.env.NEXT_PUBLIC_APPWRITE_ANSWERS_TABLE_ID ?? "answers",
  questionDecksTableId:
    process.env.NEXT_PUBLIC_APPWRITE_QUESTION_DECKS_TABLE_ID ?? "question_decks",
} as const;

export const BUBBLE = {
  minSize: 44,
  maxSize: 120,
  minFont: 11,
  maxFont: 22,
} as const;

export const TOP_GROUPS_COUNT = 5;

/** Stored on new rows until Summary runs classification. */
export const PENDING_GROUP = "";
