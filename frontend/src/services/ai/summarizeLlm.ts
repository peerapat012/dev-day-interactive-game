import { parseSummarizeResponse } from "@/services/ai/parseSummarizeResponse";
import type {
  FastApiSummarizeRequest,
  SummarizeGroupPayload,
  SummarizeResultItem,
} from "@/types/api";

const DEFAULT_SUMMARIZE_URL = "http://127.0.0.1:8000/summarize";

function getSummarizeUrl(): string {
  return process.env.LLM_SUMMARIZE_URL ?? DEFAULT_SUMMARIZE_URL;
}

/**
 * Server-only: POST /summarize with { groups } → parsed summary cards.
 * Each group.inputs is a single plain-text string (comma-separated phrases).
 */
export async function summarizeWithLlm(
  groups: SummarizeGroupPayload[],
): Promise<SummarizeResultItem[]> {
  const url = getSummarizeUrl();
  const body: FastApiSummarizeRequest = { groups };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    const hint =
      err instanceof Error ? err.message : "network error";
    throw new Error(
      `Cannot reach LLM at ${url} (${hint}). Is FastAPI running? Try LLM_SUMMARIZE_URL=http://127.0.0.1:8000/summarize`,
    );
  }

  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(
      `LLM summarize failed (${res.status}): ${rawText || res.statusText}`,
    );
  }

  let data: unknown;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(
      `LLM summarize returned non-JSON (status ${res.status}): ${rawText.slice(0, 300)}`,
    );
  }

  try {
    return parseSummarizeResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "parse error";
    throw new Error(`${message}. Raw: ${rawText.slice(0, 400)}`);
  }
}
