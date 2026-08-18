import type {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
} from "@/types/api";

/** Client → Next.js /api/generate-questions → FastAPI /generate-questions */
export async function generateQuestions(
  payload: GenerateQuestionsRequest,
): Promise<GenerateQuestionsResponse> {
  const response = await fetch("/api/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || "Question generation failed";
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      message = parsed.error ?? message;
    } catch {
      // Use the response text when the server did not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<GenerateQuestionsResponse>;
}