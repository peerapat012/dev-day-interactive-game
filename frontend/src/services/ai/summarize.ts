import type {
  SummarizeBatchRequest,
  SummarizeBatchResponse,
} from "@/types/api";

/** Client → Next.js /api/summarize → FastAPI /summarize */
export async function summarizeTopGroups(
  payload: SummarizeBatchRequest,
): Promise<SummarizeBatchResponse> {
  const res = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Summarization failed";
    try {
      const err = (await res.json()) as { error?: string };
      message = err.error ?? message;
    } catch {
      message = (await res.text()) || message;
    }
    throw new Error(message);
  }

  return res.json() as Promise<SummarizeBatchResponse>;
}
