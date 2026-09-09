import "server-only";
import { chat } from "@tanstack/ai";
import { createGeminiChat } from "@tanstack/ai-gemini";
import { z } from "zod";
import { AI_TIMEOUT_MS, getAiConfig } from "@/lib/llmServerConfig";

export async function generateStructuredOutput<T extends z.ZodType>(
  systemPrompt: string,
  input: unknown,
  schema: T,
): Promise<z.output<T>> {
  const { apiKey, model } = getAiConfig();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error("AI request timed out after 120 seconds. Please retry."));
      }, AI_TIMEOUT_MS);
    });
    const result = await Promise.race([
      chat({
        adapter: createGeminiChat(model, apiKey, {
          httpOptions: { timeout: AI_TIMEOUT_MS },
        }),
        systemPrompts: [systemPrompt],
        messages: [{ role: "user", content: JSON.stringify(input) }],
        outputSchema: schema,
        abortController: controller,
        debug: false,
      }),
      timeout,
    ]);
    return schema.parse(result);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("AI request timed out after 120 seconds. Please retry.");
    }
    // Adapter errors can contain raw responses; return only fixed messages.
    const message = error instanceof Error ? error.message : "";
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (/429|RESOURCE_EXHAUSTED|rate.?limit/i.test(message)) {
      throw new Error("Gemini rate limit reached. Please retry later.");
    }
    if (/401|403|API.?KEY|PERMISSION_DENIED|UNAUTHENTICATED/i.test(message)) {
      throw new Error("Gemini rejected the API key. Check GOOGLE_API_KEY on the Next.js server.");
    }
    if (/timeout|timed out|deadline/i.test(message)) {
      throw new Error("AI request timed out after 120 seconds. Please retry.");
    }
    if (
      error instanceof z.ZodError ||
      code === "structured-output-validation-failed" ||
      /schema|structured output|validation failed|JSON/i.test(message)
    ) {
      throw new Error("AI returned an invalid response. Please retry.");
    }
    throw new Error("Gemini request failed. Please retry.");
  } finally {
    clearTimeout(timer);
  }
}
