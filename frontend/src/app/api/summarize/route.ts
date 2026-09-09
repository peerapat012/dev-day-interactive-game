import { isMockAiEnabled } from "@/lib/llmServerConfig";
import { aiErrorResponse } from "@/services/ai/apiError";
import { summarizeRequestSchema } from "@/services/ai/requestSchemas";
import { NextResponse } from "next/server";
import { joinGroupInputs } from "@/lib/joinGroupInputs";
import { summarizeWithLlm } from "@/services/ai/summarizeLlm";
import { mockSummarizeBatch } from "@/services/ai/mock";
import type {
  SummarizeBatchResponse,
  SummarizeGroupPayload,
} from "@/types/api";

export const runtime = "nodejs";

function normalizeInputs(inputs: string | string[] | undefined): string {
  if (typeof inputs === "string") return inputs.trim();
  if (Array.isArray(inputs)) return joinGroupInputs(inputs);
  return "";
}


/**
 * Summarize top groups via TanStack AI + Gemini (or mock when LLM_USE_MOCK=true).
 */
export async function POST(request: Request) {
  const parsed = summarizeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const body = parsed.data;
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

    const summaries = isMockAiEnabled()
      ? mockSummarizeBatch(payloads)
      : await summarizeWithLlm(payloads);

    const response: SummarizeBatchResponse = { summaries };
    return NextResponse.json(response);
  } catch (err) {
    return aiErrorResponse(err, "Summarization failed");
  }
}
