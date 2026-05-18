import { NextResponse } from "next/server";
import { joinGroupInputs } from "@/lib/joinGroupInputs";
import { summarizeWithLlm } from "@/services/ai/summarizeLlm";
import { mockSummarizeBatch } from "@/services/ai/mock";
import type {
  SummarizeBatchRequest,
  SummarizeBatchResponse,
  SummarizeGroupPayload,
} from "@/types/api";

const USE_MOCK = process.env.LLM_USE_MOCK === "true";

function normalizeInputs(inputs: string | string[] | undefined): string {
  if (typeof inputs === "string") return inputs.trim();
  if (Array.isArray(inputs)) return joinGroupInputs(inputs);
  return "";
}

/**
 * Summarize top groups via FastAPI POST /summarize (or mock when LLM_USE_MOCK=true).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as SummarizeBatchRequest;
  const groups = Array.isArray(body.groups) ? body.groups : [];

  if (groups.length === 0) {
    return NextResponse.json(
      { error: "groups array is required" },
      { status: 400 },
    );
  }

  for (const g of groups) {
    if (!g.group?.trim()) {
      return NextResponse.json(
        { error: "each group must have a group name" },
        { status: 400 },
      );
    }
  }

  try {
    const payloads: SummarizeGroupPayload[] = groups.map((g) => ({
      group: g.group.trim(),
      inputs: normalizeInputs(g.inputs as string | string[]),
    }));

    const summaries = USE_MOCK
      ? mockSummarizeBatch(payloads)
      : await summarizeWithLlm(payloads);

    const response: SummarizeBatchResponse = { summaries };
    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Summarization failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
