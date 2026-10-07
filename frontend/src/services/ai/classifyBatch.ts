import "server-only";
import { z } from "zod";
import { generateStructuredOutput } from "@/services/ai/structuredOutput";
import { CLASSIFY_BATCH_PROMPT } from "@/services/ai/prompts";
import { validateResultKeys } from "@/services/ai/validateResultKeys";
import type { ClassifyBatchItem, AiClassifyBatchResponse } from "@/types/api";

const schema = z.object({
  results: z.array(z.object({ id: z.string().min(1), group: z.string().trim().min(1) })),
});

export async function classifyBatchWithLlm(
  items: ClassifyBatchItem[],
  question?: string,
): Promise<AiClassifyBatchResponse> {
  if (items.length === 0) return { results: [] };
  const input = question ? { question, inputs: items } : { inputs: items };
  const result = await generateStructuredOutput(CLASSIFY_BATCH_PROMPT, input, schema);
  validateResultKeys(items.map((item) => item.id), result.results.map((item) => item.id));
  return result;
}
