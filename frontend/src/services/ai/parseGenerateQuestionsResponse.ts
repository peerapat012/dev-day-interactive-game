import type { GeneratedQuestion } from "@/types/api";

function parseOptions(value: unknown, index: number): string[] {
  if (Array.isArray(value)) {
    return value
      .map((option) => String(option ?? "").trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;|]/)
      .map((option) => option.trim())
      .filter(Boolean);
  }
  throw new Error(`LLM questions: invalid options at question index ${index}`);
}

function itemToQuestion(item: unknown, index: number): GeneratedQuestion {
  if (!item || typeof item !== "object") {
    throw new Error(`LLM questions: invalid item at index ${index}`);
  }
  const row = item as Record<string, unknown>;
  const prompt = String(
    row.prompt ?? row.question ?? row.text ?? row.message ?? row.content ?? "",
  ).trim();

  if (!prompt) {
    throw new Error(`LLM questions: item at index ${index} is missing a prompt`);
  }

  const options = parseOptions(row.options ?? row.choices ?? row.answers, index);
  if (options.length < 2) {
    throw new Error(
      `LLM questions: item at index ${index} needs at least two options`,
    );
  }

  let correctOptionIndex = Number(row.correctOptionIndex ?? row.correct ?? 0);
  if (!Number.isInteger(correctOptionIndex) || correctOptionIndex < 0) {
    correctOptionIndex = 0;
  }
  if (correctOptionIndex >= options.length) {
    correctOptionIndex = 0;
  }

  return { prompt, options, correctOptionIndex };
}

function listFromRecord(record: Record<string, unknown>): unknown {
  return (
    record.questions ?? record.results ?? record.data ?? record.question_set
  );
}

/**
 * Accepts common FastAPI response shapes:
 * - { questions: [{ prompt, options, correctOptionIndex }] }
 * - { data: [...] }
 * - [{ prompt, options, correctOptionIndex }]
 */
export function parseGenerateQuestionsResponse(
  data: unknown,
): GeneratedQuestion[] {
  if (data === null || data === undefined) {
    throw new Error("LLM questions: empty response body");
  }

  if (Array.isArray(data)) {
    return data.map((item, i) => itemToQuestion(item, i));
  }

  if (typeof data !== "object") {
    throw new Error(
      `LLM questions: expected JSON object or array, got ${typeof data}`,
    );
  }

  const root = data as Record<string, unknown>;
  const list = listFromRecord(root);

  if (!Array.isArray(list) || list.length === 0) {
    const keys = Object.keys(root).join(", ") || "(none)";
    const preview = JSON.stringify(root).slice(0, 400);
    throw new Error(
      `LLM questions: could not find questions array. Top-level keys: ${keys}. Body: ${preview}`,
    );
  }

  return list.map((item, i) => itemToQuestion(item, i));
}