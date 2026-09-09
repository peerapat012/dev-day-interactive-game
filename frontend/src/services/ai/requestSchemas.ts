import { z } from "zod";

export const classifyRequestSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    input: z.string(),
    name: z.string().optional(),
  })),
});

export const summarizeRequestSchema = z.object({
  groups: z.array(z.object({
    group: z.string(),
    inputs: z.union([z.string(), z.array(z.string())]).optional(),
  })),
});

export const questionsRequestSchema = z.object({
  topic: z.string().optional(),
  questionCount: z.number().int().optional(),
  optionCount: z.number().int().optional(),
  language: z.string().optional(),
});
