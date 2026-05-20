import type {
  ClassifyBatchItem,
  ClassifyBatchResponse,
} from "@/types/api";

/** Client → Next.js /api/classify (batch, one LLM call). */
export async function classifyInputsBatch(
  items: ClassifyBatchItem[],
): Promise<ClassifyBatchResponse> {
  if (items.length === 0) {
    return { results: [] };
  }

  const res = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let message = raw || "Classification failed";
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      /* use raw text */
    }
    throw new Error(message);
  }

  return res.json() as Promise<ClassifyBatchResponse>;
}
