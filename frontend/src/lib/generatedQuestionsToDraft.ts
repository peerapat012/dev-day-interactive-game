import type { GeneratedQuestion } from "@/types/api";

export interface DraftOption {
  id: string;
  text: string;
}

export interface DraftQuestion {
  id: string;
  prompt: string;
  options: DraftOption[];
  correctOptionId: string;
  timeLimitMs: number;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Convert AI-generated questions into editor drafts, wiring the correct option id. */
export function generatedQuestionsToDraft(
  questions: GeneratedQuestion[],
  timeLimitMs = 20000,
): DraftQuestion[] {
  return questions.map((question) => {
    const options = question.options.map((text) => ({
      id: uid(),
      text,
    }));
    const correctOptionId =
      options[question.correctOptionIndex]?.id ?? options[0]?.id ?? "";
    return {
      id: uid(),
      prompt: question.prompt,
      options,
      correctOptionId,
      timeLimitMs,
    };
  });
}