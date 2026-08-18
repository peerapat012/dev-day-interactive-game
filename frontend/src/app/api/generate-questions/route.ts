import { NextResponse } from "next/server";
import { generateQuestionsWithLlm } from "@/services/ai/generateQuestionsLlm";
import { mockGenerateQuestions } from "@/services/ai/mock";
import type {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
} from "@/types/api";

const USE_MOCK = process.env.LLM_USE_MOCK === "true";

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
 * Generate quiz questions via FastAPI POST /generate-questions
 * (or mock when LLM_USE_MOCK=true).
 */
export async function POST(request: Request) {
  let body: Partial<GenerateQuestionsRequest>;
  try {
    body = (await request.json()) as Partial<GenerateQuestionsRequest>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

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
    const response: GenerateQuestionsResponse = USE_MOCK
      ? { questions: mockGenerateQuestions(requestBody) }
      : await generateQuestionsWithLlm(requestBody);

    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Question generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}