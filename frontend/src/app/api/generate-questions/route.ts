import { isMockAiEnabled } from "@/lib/llmServerConfig";
import { aiErrorResponse } from "@/services/ai/apiError";
import { questionsRequestSchema } from "@/services/ai/requestSchemas";
import { NextResponse } from "next/server";
import { generateQuestionsWithLlm } from "@/services/ai/generateQuestionsLlm";
import { mockGenerateQuestions } from "@/services/ai/mock";
import type {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
} from "@/types/api";

export const runtime = "nodejs";

const MAX_QUESTION_COUNT = 20;
const MIN_OPTION_COUNT = 2;
const MAX_OPTION_COUNT = 8;

function normalizeRequest(body: Partial<GenerateQuestionsRequest>) {
  const topic = body.topic?.trim() ?? "";
  const questionCount = Math.max(1, Number(body.questionCount) || 1);
  const optionCount = Math.max(
    MIN_OPTION_COUNT,
    Math.min(MAX_OPTION_COUNT, Number(body.optionCount) || MIN_OPTION_COUNT),
  );
  const language = body.language?.trim() || "English";
  return { topic, questionCount, optionCount, language };
}

/**
 * Generate quiz questions via TanStack AI + Gemini
 * (or mock when LLM_USE_MOCK=true).
 */
export async function POST(request: Request) {
  const parsed = questionsRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const body = parsed.data;

  const requestBody = normalizeRequest(body);

  if (!requestBody.topic) {
    return NextResponse.json(
      { error: "topic is required" },
      { status: 400 },
    );
  }
  if (requestBody.questionCount > MAX_QUESTION_COUNT) {
    return NextResponse.json(
      { error: `questionCount must be at most ${MAX_QUESTION_COUNT}` },
      { status: 400 },
    );
  }

  try {
    const response: GenerateQuestionsResponse = isMockAiEnabled()
      ? { questions: mockGenerateQuestions(requestBody) }
      : await generateQuestionsWithLlm(requestBody);

    return NextResponse.json(response);
  } catch (err) {
    return aiErrorResponse(err, "Question generation failed");
  }
}