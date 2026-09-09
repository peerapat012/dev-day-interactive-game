import "server-only";
import { z } from "zod";
import { generateStructuredOutput } from "@/services/ai/structuredOutput";
import { SUMMARIZE_PROMPT } from "@/services/ai/prompts";
import { validateResultKeys } from "@/services/ai/validateResultKeys";
import { assertThaiSummaryContract } from "@/lib/validateThaiSummary";
import type { SummarizeGroupPayload, SummarizeResultItem } from "@/types/api";

const schema = z.object({
  summaries: z.array(z.object({
    group: z.string().min(1),
    topic: z.string().trim().min(1),
    summary: z.string().trim().min(1),
  })),
});

export async function summarizeWithLlm(groups: SummarizeGroupPayload[]): Promise<SummarizeResultItem[]> {
  if (groups.length === 0) return [];
  const { summaries } = await generateStructuredOutput(SUMMARIZE_PROMPT, { groups }, schema);
  validateResultKeys(groups.map((group) => group.group), summaries.map((item) => item.group));
  assertThaiSummaryContract(summaries);
  return summaries;
}
