import {
  invokeAppwriteFunction,
  useAppwriteLlmFunction,
} from "@/services/ai/appwriteFunction";
import { getLlmClassifyBatchUrl } from "@/lib/llmServerConfig";
import { fetchLlm } from "@/lib/llmFetch";
import type {
  ClassifyBatchItem,
  FastApiClassifyBatchRequest,
  FastApiClassifyBatchResponse,
} from "@/types/api";

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

  const url = getLlmClassifyBatchUrl();
  const res = await fetchLlm(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    },
    "LLM classify-batch",
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `LLM classify-batch failed (${res.status}): ${detail || res.statusText}`,
    );
  }

  return (await res.json()) as FastApiClassifyBatchResponse;
}
