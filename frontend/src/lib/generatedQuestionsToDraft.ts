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

export const MIN_DRAFT_OPTIONS = 2;
export const MAX_DRAFT_OPTIONS = 8;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addDraftOption(question: DraftQuestion): DraftQuestion {
  if (question.options.length >= MAX_DRAFT_OPTIONS) return question;
  return {
    ...question,
    options: [...question.options, { id: uid(), text: "" }],
  };
}

export function removeDraftOption(
  question: DraftQuestion,
  optionId: string,
): DraftQuestion {
  if (question.options.length <= MIN_DRAFT_OPTIONS) return question;
  const options = question.options.filter((option) => option.id !== optionId);
  const stillValid = options.some(
    (option) => option.id === question.correctOptionId,
  );
  return {
    ...question,
    options,
    correctOptionId: stillValid
      ? question.correctOptionId
      : (options[0]?.id ?? ""),
  };
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