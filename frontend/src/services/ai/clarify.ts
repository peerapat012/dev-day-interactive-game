import {
  invokeAppwriteFunction,
  useAppwriteLlmFunction,
} from "@/services/ai/appwriteFunction";
import type { ChatRequest, ChatResponse } from "@/types/api";

const DEFAULT_CLARIFY_URL = "http://localhost:8000/clarify";

function getClarifyUrl(): string {
  return process.env.LLM_CLARIFY_URL ?? DEFAULT_CLARIFY_URL;
}

/**
 * Server-only: calls POST /clarify with { message } → { message }.
 * Uses Appwrite Function when LLM_USE_APPWRITE_FUNCTION=true, else direct URL.
 */
export async function clarifyWithLlm(message: string): Promise<string> {
  const body: ChatRequest = { message };

  const data = useAppwriteLlmFunction()
    ? ((await invokeAppwriteFunction("/clarify", "POST", body)) as ChatResponse)
    : await fetchClarifyDirect(body);
  const group = data.message?.trim();

  if (!group) {
    throw new Error("LLM clarify returned an empty message");
  }

  return group;
}

async function fetchClarifyDirect(body: ChatRequest): Promise<ChatResponse> {
  const url = getClarifyUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `LLM clarify failed (${res.status}): ${detail || res.statusText}`,
    );
  }

  return (await res.json()) as ChatResponse;
}
