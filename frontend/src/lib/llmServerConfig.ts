import "server-only";

export const AI_TIMEOUT_MS = 120_000;
export class AiConfigurationError extends Error {}

export function isMockAiEnabled(): boolean {
  return process.env.LLM_USE_MOCK === "true";
}

/**
 * Accepts either the full Azure Responses endpoint
 * (`https://<host>/openai/responses?api-version=...`) or its base
 * (`https://<host>/openai`); the OpenAI SDK appends `/responses` itself.
 */
function parseAzureEndpoint(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AiConfigurationError("AZURE_OPENAI_BASE_URL is not a valid URL.");
  }
  const apiVersion = url.searchParams.get("api-version") ?? undefined;
  url.search = "";
  const baseURL = url.toString().replace(/\/+$/, "").replace(/\/responses$/, "");
  return { baseURL, apiVersion };
}

export function getAiConfig() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  const endpoint = process.env.AZURE_OPENAI_BASE_URL?.trim();
  if (!apiKey || !endpoint) {
    throw new AiConfigurationError(
      "Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_BASE_URL on the Next.js server to enable AI.",
    );
  }
  const model = process.env.AI_MODEL?.trim();
  if (!model) {
    throw new AiConfigurationError("Set AI_MODEL to the Azure OpenAI deployment name.");
  }
  return { apiKey, model, ...parseAzureEndpoint(endpoint) };
}
