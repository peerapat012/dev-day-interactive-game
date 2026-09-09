import { isMockAiEnabled } from "@/lib/llmServerConfig";
import { aiErrorResponse } from "@/services/ai/apiError";
import { classifyRequestSchema } from "@/services/ai/requestSchemas";
import { NextResponse } from "next/server";
import { classifyBatchWithLlm } from "@/services/ai/classifyBatch";
import { mockClassifyBatch } from "@/services/ai/mock";
import type {
  ClassifyBatchResponse,
} from "@/types/api";

/** Pass through LLM group labels as-is (only trim whitespace). */
function rawGroupLabel(group: string | undefined): string {
  return group?.trim() ?? "";
}

export const runtime = "nodejs";

/**
 * Batch-classify pending inputs in one LLM call (TanStack AI + Gemini).
 */
export async function POST(request: Request) {
  const parsed = classifyRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const body = parsed.data;
  const items = Array.isArray(body.items)
    ? body.items
        .map((item) => ({
          id: item.id?.trim() ?? "",
          input: item.input?.trim() ?? "",
        }))
        .filter((item) => item.id && item.input)
    : [];

  if (items.length === 0) {
    return NextResponse.json(
      { error: "items array with id and input is required" },
      { status: 400 },
    );
  }

  try {
    const llmResults = isMockAiEnabled()
      ? mockClassifyBatch(items)
      : (await classifyBatchWithLlm(items)).results;

    const groupById = new Map(
      llmResults.map((row) => [row.id, rawGroupLabel(row.group)]),
    );

    const response: ClassifyBatchResponse = {
      results: items.map((item) => ({
        id: item.id,
        input: item.input,
        group: groupById.get(item.id) ?? "",
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    return aiErrorResponse(err, "Classification failed");
  }
}
