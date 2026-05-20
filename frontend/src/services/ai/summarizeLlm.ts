import {
  invokeAppwriteFunction,
  useAppwriteLlmFunction,
} from "@/services/ai/appwriteFunction";
import { getLlmSummarizeUrl } from "@/lib/llmServerConfig";
import { fetchLlm } from "@/lib/llmFetch";
import { parseSummarizeResponse } from "@/services/ai/parseSummarizeResponse";
import type {
  FastApiSummarizeRequest,
  SummarizeGroupPayload,
  SummarizeResultItem,
} from "@/types/api";

/**
 * Server-only: POST /summarize with { groups } → parsed summary cards.
 * Uses Appwrite Function when LLM_USE_APPWRITE_FUNCTION=true, else direct URL.
 */
export async function summarizeWithLlm(
  groups: SummarizeGroupPayload[],
): Promise<SummarizeResultItem[]> {
  const body: FastApiSummarizeRequest = { groups };

  let data: unknown;
  if (useAppwriteLlmFunction()) {
    data = await invokeAppwriteFunction("/summarize", "POST", body);
  } else {
    data = await fetchSummarizeDirect(body);
  }

  try {
    return parseSummarizeResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "parse error";
    const raw = JSON.stringify(data).slice(0, 400);
    throw new Error(`${message}. Raw: ${raw}`);
  }
}

async function fetchSummarizeDirect(
  body: FastApiSummarizeRequest,
): Promise<unknown> {
  const url = getLlmSummarizeUrl();
  const res = await fetchLlm(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    },
    "LLM summarize",
  );

  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(
      `LLM summarize failed (${res.status}): ${rawText || res.statusText}`,
    );
  }

  try {
    return rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(
      `LLM summarize returned non-JSON (status ${res.status}): ${rawText.slice(0, 300)}`,
    );
  }
}
