import { APPWRITE } from "@/lib/constants";

type ExecutionResponse = {
  status?: string;
  responseStatusCode?: number;
  responseBody?: string;
  errors?: string;
};

/**
 * Invoke an Appwrite Function via POST /v1/functions/{id}/executions.
 * Used when LLM runs on Appwrite instead of a local FastAPI server.
 */
export async function invokeAppwriteFunction(
  path: string,
  method: string,
  body?: unknown,
): Promise<unknown> {
  const functionId =
    process.env.LLM_APPWRITE_FUNCTION_ID ?? "dev-day-interactive-game-backend";
  const endpoint = APPWRITE.endpoint.replace(/\/$/, "");
  const projectId = APPWRITE.projectId;

  if (!endpoint || !projectId) {
    throw new Error(
      "Missing Appwrite env for LLM function: NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    );
  }

  const url = `${endpoint}/functions/${functionId}/executions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({
      path,
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      async: false,
    }),
    cache: "no-store",
  });

  const execution = (await res.json()) as ExecutionResponse;

  if (!res.ok) {
    throw new Error(
      execution.errors ||
        `Appwrite function request failed (${res.status})`,
    );
  }

  if (execution.status === "failed" || (execution.responseStatusCode ?? 0) >= 400) {
    throw new Error(
      execution.errors ||
        execution.responseBody ||
        `Appwrite function execution failed (${execution.responseStatusCode})`,
    );
  }

  const raw = execution.responseBody?.trim();
  if (!raw) {
    throw new Error("Appwrite function returned an empty response body");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(
      `Appwrite function returned non-JSON: ${raw.slice(0, 300)}`,
    );
  }
}

export function useAppwriteLlmFunction(): boolean {
  return process.env.LLM_USE_APPWRITE_FUNCTION === "true";
}
