import {
  invokeAppwriteFunction,
  useAppwriteLlmFunction,
} from "@/services/ai/appwriteFunction";
import type {
  ClassifyBatchItem,
  FastApiClassifyBatchRequest,
  FastApiClassifyBatchResponse,
} from "@/types/api";

const DEFAULT_CLASSIFY_BATCH_URL = "http://localhost:8000/classify-batch";

function getClassifyBatchUrl(): string {
  return process.env.LLM_CLASSIFY_BATCH_URL ?? DEFAULT_CLASSIFY_BATCH_URL;
}

/**
 * Server-only: classify many inputs in one LLM call.
 */
export async function classifyBatchWithLlm(
  items: ClassifyBatchItem[],
): Promise<FastApiClassifyBatchResponse> {
  if (items.length === 0) {
    return { results: [] };
  }

  const body: FastApiClassifyBatchRequest = { inputs: items };

  if (useAppwriteLlmFunction()) {
    return (await invokeAppwriteFunction(
      "/classify-batch",
      "POST",
      body,
    )) as FastApiClassifyBatchResponse;
  }

  const url = getClassifyBatchUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `LLM classify-batch failed (${res.status}): ${detail || res.statusText}`,
    );
  }

  return (await res.json()) as FastApiClassifyBatchResponse;
}
