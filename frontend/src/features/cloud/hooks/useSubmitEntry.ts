"use client";

import { useCallback } from "react";
import { classifyInput } from "@/services/ai/classify";
import { createEntry } from "@/services/appwrite/entries";
import { getAccount } from "@/services/appwrite/auth";
import { normalizeGroupName } from "@/lib/normalizeGroupName";
import { useEntriesStore } from "@/store/entriesStore";
import { usePlayerStore } from "@/store/playerStore";

export function useSubmitEntry() {
  const isSubmitting = useEntriesStore((s) => s.isSubmitting);
  const setSubmitting = useEntriesStore((s) => s.setSubmitting);
  const setError = useEntriesStore((s) => s.setError);
  const upsertEntry = useEntriesStore((s) => s.upsertEntry);
  const displayName = usePlayerStore((s) => s.displayName);

  const submit = useCallback(
    async (rawInput: string) => {
      const input = rawInput.trim();
      if (!input || isSubmitting) return;

      setSubmitting(true);
      setError(null);

      try {
        const { group: rawGroup } = await classifyInput(input);
        const group = normalizeGroupName(rawGroup);

        let name = displayName.trim() || "guest";
        if (!displayName.trim()) {
          try {
            const user = await getAccount().get();
            name = user.name || user.$id.slice(0, 8);
          } catch {
            /* anonymous guest */
          }
        }

        const entry = await createEntry({
          name,
          input,
          group,
          createdAt: new Date().toISOString(),
        });

        upsertEntry(entry);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Submit failed");
      } finally {
        setSubmitting(false);
      }
    },
    [isSubmitting, setSubmitting, setError, upsertEntry, displayName],
  );

  return { submit, isSubmitting };
}
