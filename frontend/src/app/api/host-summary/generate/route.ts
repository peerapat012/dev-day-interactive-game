import { isMockAiEnabled } from "@/lib/llmServerConfig";
import { aiErrorResponse } from "@/services/ai/apiError";
import { classifyRequestSchema } from "@/services/ai/requestSchemas";
import { NextResponse } from "next/server";
import { orchestrateHostSummary } from "@/lib/orchestrateHostSummary";
import { classifyBatchWithLlm } from "@/services/ai/classifyBatch";
import { mockClassifyBatch, mockSummarizeBatch } from "@/services/ai/mock";
import { summarizeWithLlm } from "@/services/ai/summarizeLlm";
import type {
  HostSummaryGenerateItem,
  HostSummaryGenerateRequest,
} from "@/types/api";

export const runtime = "nodejs";

function normalizeItems(
  body: HostSummaryGenerateRequest,
): HostSummaryGenerateItem[] {
  if (!Array.isArray(body.items)) return [];

  return body.items
    .map((item) => {
      const name = item.name?.trim() ?? "";
      return {
        id: item.id?.trim() ?? "",
        input: item.input?.trim() ?? "",
        ...(name ? { name } : {}),
      };
    })
    .filter((item) => item.id && item.input);
}

export async function POST(request: Request) {
  const parsed = classifyRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const body = parsed.data;

  const items = normalizeItems(body);
  if (items.length === 0) {
    return NextResponse.json(
      { error: "items array with id and input is required" },
      { status: 400 },
    );
  }

  try {
    const result = await orchestrateHostSummary(items, {
      classify: async (pendingItems) =>
        isMockAiEnabled()
          ? mockClassifyBatch(pendingItems)
          : (await classifyBatchWithLlm(pendingItems)).results,
      summarize: async (groups) =>
        isMockAiEnabled() ? mockSummarizeBatch(groups) : summarizeWithLlm(groups),
    });

    return NextResponse.json(result);
  } catch (err) {
    return aiErrorResponse(err, "Summary generation failed");
  }
}
