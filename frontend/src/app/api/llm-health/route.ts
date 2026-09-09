import { NextResponse } from "next/server";
import { getAiConfig, isMockAiEnabled } from "@/lib/llmServerConfig";

/** Configuration readiness only: never sends a billable provider request. */
export async function GET() {
  if (isMockAiEnabled()) {
    return NextResponse.json({ mode: "mock", ok: true, providerChecked: false });
  }
  try {
    const { model } = getAiConfig();
    return NextResponse.json({
      mode: "tanstack", provider: "gemini", model, ok: true,
      providerChecked: false,
      message: "AI is configured. Gemini connectivity and credentials have not been tested.",
    });
  } catch (error) {
    return NextResponse.json({
      mode: "tanstack", provider: "gemini", ok: false, providerChecked: false,
      error: error instanceof Error ? error.message : "AI configuration is invalid.",
    }, { status: 503 });
  }
}
