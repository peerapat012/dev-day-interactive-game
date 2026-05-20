const LOCAL_LLM_BASE = "http://127.0.0.1:8000";

/** Server-only LLM routing for Next.js API routes. */
export function useAppwriteLlmFunction(): boolean {
  const flag = process.env.LLM_USE_APPWRITE_FUNCTION;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function getLlmClassifyBatchUrl(): string {
  return (
    process.env.LLM_CLASSIFY_BATCH_URL ?? `${LOCAL_LLM_BASE}/classify-batch`
  );
}

export function getLlmSummarizeUrl(): string {
  return process.env.LLM_SUMMARIZE_URL ?? `${LOCAL_LLM_BASE}/summarize`;
}

export function getLlmClarifyUrl(): string {
  return process.env.LLM_CLARIFY_URL ?? `${LOCAL_LLM_BASE}/clarify`;
}

export function getLlmHealthUrl(): string {
  return process.env.LLM_HEALTH_URL ?? `${LOCAL_LLM_BASE}/health`;
}
