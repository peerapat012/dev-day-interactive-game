import { NextResponse } from "next/server";
import { classifyBatchWithLlm } from "@/services/ai/classifyBatch";
import { mockClassifyBatch } from "@/services/ai/mock";
import type {
  ClassifyBatchRequest,
  ClassifyBatchResponse,
} from "@/types/api";

/** Pass through LLM group labels as-is (only trim whitespace). */
function rawGroupLabel(group: string | undefined): string {
  return group?.trim() ?? "";
}

const USE_MOCK = process.env.LLM_USE_MOCK === "true";

/**
 * Batch-classify pending inputs in one LLM call (FastAPI POST /classify-batch).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as ClassifyBatchRequest;
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
    const llmResults = USE_MOCK
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
    const message =
      err instanceof Error ? err.message : "Classification failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
