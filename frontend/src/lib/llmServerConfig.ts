import "server-only";
import { GEMINI_MODELS } from "@tanstack/ai-gemini";

export const AI_TIMEOUT_MS = 120_000;
export class AiConfigurationError extends Error {}

export function isMockAiEnabled(): boolean {
  return process.env.LLM_USE_MOCK === "true";
}

export function getAiConfig() {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    throw new AiConfigurationError("Set GOOGLE_API_KEY on the Next.js server to enable AI.");
  }
  const requestedModel = process.env.AI_MODEL?.trim() || "gemini-3.1-flash-lite";
  const model = GEMINI_MODELS.find((candidate) => candidate === requestedModel);
  if (!model) {
    throw new AiConfigurationError("AI_MODEL is not supported by the installed Gemini adapter.");
  }
  return { apiKey, model };
}
