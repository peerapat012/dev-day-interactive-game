import {
  invokeAppwriteFunction,
  useAppwriteLlmFunction,
} from "@/services/ai/appwriteFunction";
import { getLlmGenerateQuestionsUrl } from "@/lib/llmServerConfig";
import { fetchLlm } from "@/lib/llmFetch";
import { parseGenerateQuestionsResponse } from "@/services/ai/parseGenerateQuestionsResponse";
import type {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  GeneratedQuestion,
} from "@/types/api";

/** FastAPI POST /generate-questions request body (snake_case fields). */
interface FastApiGenerateQuestionsRequest {
  topic: string;
  question_count: number;
  option_count: number;
  language: string;
}

/**
 * Server-only: POST /generate-questions with { topic, questionCount, ... }
 * → parsed question list. Uses Appwrite Function when
 * LLM_USE_APPWRITE_FUNCTION=true, else direct URL.
 */
export async function generateQuestionsWithLlm(
  request: GenerateQuestionsRequest,
): Promise<GenerateQuestionsResponse> {
  const body: FastApiGenerateQuestionsRequest = {
    topic: request.topic,
    question_count: request.questionCount,
    option_count: request.optionCount,
    language: request.language,
  };

  let data: unknown;
  if (useAppwriteLlmFunction()) {
    data = await invokeAppwriteFunction("/generate-questions", "POST", body);
  } else {
    data = await fetchGenerateQuestionsDirect(body);
  }

  try {
    const questions: GeneratedQuestion[] =
      parseGenerateQuestionsResponse(data);
    return { questions };
  } catch (err) {
    const message = err instanceof Error ? err.message : "parse error";
    const raw = JSON.stringify(data).slice(0, 400);
    throw new Error(`${message}. Raw: ${raw}`);
  }
}

async function fetchGenerateQuestionsDirect(
  body: FastApiGenerateQuestionsRequest,
): Promise<unknown> {
  const url = getLlmGenerateQuestionsUrl();
  const res = await fetchLlm(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    },
    "LLM generate questions",
  );

  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(
      `LLM generate questions failed (${res.status}): ${rawText || res.statusText}`,
    );
  }

  try {
    return rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(
      `LLM generate questions returned non-JSON (status ${res.status}): ${rawText.slice(0, 300)}`,
    );
  }
}