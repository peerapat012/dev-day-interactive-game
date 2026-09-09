import "server-only";
import { z } from "zod";
import { generateStructuredOutput } from "@/services/ai/structuredOutput";
import { GENERATE_QUESTIONS_PROMPT } from "@/services/ai/prompts";
import type { GenerateQuestionsRequest, GenerateQuestionsResponse } from "@/types/api";

export async function generateQuestionsWithLlm(request: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
  const schema = z.object({
    questions: z.array(z.object({
      prompt: z.string().trim().min(1),
      options: z.array(z.string().trim().min(1)).length(request.optionCount),
      correctOptionIndex: z.number().int().min(0).max(request.optionCount - 1),
    })).length(request.questionCount),
  });
  return generateStructuredOutput(GENERATE_QUESTIONS_PROMPT, {
    topic: request.topic,
    question_count: request.questionCount,
    option_count: request.optionCount,
    language: request.language,
  }, schema);
}
