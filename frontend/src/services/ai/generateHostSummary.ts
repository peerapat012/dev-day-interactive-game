import type {
  HostSummaryGenerateRequest,
  HostSummaryGenerateResponse,
} from "@/types/api";
import { updateEntry } from "@/services/appwrite/entries";
import { updateRoomSnapshot } from "@/services/appwrite/rooms";

/** Run classification and summarization through one backend operation. */
export async function generateHostSummary(
  payload: HostSummaryGenerateRequest,
): Promise<HostSummaryGenerateResponse> {
  const response = await fetch("/api/host-summary/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || "Summary generation failed";
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      message = parsed.error ?? message;
    } catch {
      // Use the response text when the server did not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<HostSummaryGenerateResponse>;
}

/** Generate once, then persist active groups and summarizeJson without history. */
export async function generateAndSaveHostSummary(
  roomRowId: string,
  payload: HostSummaryGenerateRequest,
): Promise<HostSummaryGenerateResponse> {
  const result = await generateHostSummary(payload);

  await Promise.all(
    result.entryGroups.map(({ id, group }) => updateEntry(id, { group })),
  );
  await updateRoomSnapshot(roomRowId, {
    groups: result.groups,
    summaries: result.summaries,
  });

  return result;
}
