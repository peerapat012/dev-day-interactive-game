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
    const err = await res.text();
    throw new Error(err || "Classification failed");
  }

  return res.json() as Promise<ClassifyBatchResponse>;
}
