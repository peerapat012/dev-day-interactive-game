import { NextResponse } from "next/server";
import { clarifyWithLlm } from "@/services/ai/clarify";
import { mockClassifyGroup } from "@/services/ai/mock";
import { normalizeGroupName } from "@/lib/normalizeGroupName";
import type { ClassifyRequest, ClassifyResponse } from "@/types/api";

const USE_MOCK = process.env.LLM_USE_MOCK === "true";

/**
 * Classify user input via FastAPI POST /clarify, or mock when LLM_USE_MOCK=true.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as ClassifyRequest;
  const input = body.input?.trim();

  if (!input) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  try {
    const rawGroup = USE_MOCK ? mockClassifyGroup(input) : await clarifyWithLlm(input);
    const group = normalizeGroupName(rawGroup);
    const response: ClassifyResponse = { input, group };
    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Classification failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
