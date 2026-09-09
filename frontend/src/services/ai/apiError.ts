import "server-only";
import { NextResponse } from "next/server";
import { AiConfigurationError } from "@/lib/llmServerConfig";

export function aiErrorResponse(error: unknown, fallback: string) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: error instanceof AiConfigurationError ? 503 : 502 },
  );
}
