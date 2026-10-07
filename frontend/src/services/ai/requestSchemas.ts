import { z } from "zod";
import { ROUND_QUESTION_MAX_LENGTH } from "@/lib/constants";

const roundQuestionSchema = z.string().max(ROUND_QUESTION_MAX_LENGTH).optional();

export const classifyRequestSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    input: z.string(),
    name: z.string().optional(),
  })),
  question: roundQuestionSchema,
});

export const summarizeRequestSchema = z.object({
  groups: z.array(z.object({
    group: z.string(),
    inputs: z.union([z.string(), z.array(z.string())]).optional(),
  })),
  question: roundQuestionSchema,
});

export const questionsRequestSchema = z.object({
  topic: z.string().optional(),
  questionCount: z.number().int().optional(),
  optionCount: z.number().int().optional(),
  language: z.string().optional(),
});
