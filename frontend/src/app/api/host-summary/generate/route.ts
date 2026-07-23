import { NextResponse } from "next/server";
import { orchestrateHostSummary } from "@/lib/orchestrateHostSummary";
import { classifyBatchWithLlm } from "@/services/ai/classifyBatch";
import { mockClassifyBatch, mockSummarizeBatch } from "@/services/ai/mock";
import { summarizeWithLlm } from "@/services/ai/summarizeLlm";
import type {
  HostSummaryGenerateItem,
  HostSummaryGenerateRequest,
} from "@/types/api";

const USE_MOCK = process.env.LLM_USE_MOCK === "true";

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
  let body: HostSummaryGenerateRequest;
  try {
    body = (await request.json()) as HostSummaryGenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

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
        USE_MOCK
          ? mockClassifyBatch(pendingItems)
          : (await classifyBatchWithLlm(pendingItems)).results,
      summarize: async (groups) =>
        USE_MOCK ? mockSummarizeBatch(groups) : summarizeWithLlm(groups),
    });

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Summary generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
