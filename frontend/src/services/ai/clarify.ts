import type { ChatRequest, ChatResponse } from "@/types/api";

const DEFAULT_CLARIFY_URL = "http://localhost:8000/clarify";

function getClarifyUrl(): string {
  return process.env.LLM_CLARIFY_URL ?? DEFAULT_CLARIFY_URL;
}

/**
 * Server-only: calls FastAPI POST /clarify with { message } → { message }.
 */
export async function clarifyWithLlm(message: string): Promise<string> {
  const url = getClarifyUrl();
  const body: ChatRequest = { message };

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

  const data = (await res.json()) as ChatResponse;
  const group = data.message?.trim();

  if (!group) {
    throw new Error("LLM clarify returned an empty message");
  }

  return group;
}
