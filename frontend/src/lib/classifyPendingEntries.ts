import { classifyInputsBatch } from "@/services/ai/classify";
import { updateEntry } from "@/services/appwrite/entries";
import { isClassifiedEntry } from "@/lib/aggregateEntries";
import type { Entry } from "@/types/entry";

/** Classify all pending rows in one API / LLM call, then persist groups. */
export async function classifyPendingEntries(
  entries: Entry[],
): Promise<Entry[]> {
  const pending = entries.filter((e) => !isClassifiedEntry(e));
  if (pending.length === 0) return [];

  const { results } = await classifyInputsBatch(
    pending.map((entry) => ({ id: entry.$id, input: entry.input })),
  );

  const groupById = new Map(results.map((row) => [row.id, row.group]));

  const updated = await Promise.all(
    pending.map(async (entry) => {
      const group = groupById.get(entry.$id);
      if (!group) return null;
      return updateEntry(entry.$id, { group });
    }),
  );

  return updated.filter((entry): entry is Entry => entry !== null);
}
