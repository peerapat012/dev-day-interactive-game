import { ROUND_QUESTION_MAX_LENGTH } from "@/lib/constants";

/** Single normalization for the optional round question: trimmed, clamped, "" when unset. */
export function normalizeRoundQuestion(question: string | null | undefined): string {
  return (question ?? "").trim().slice(0, ROUND_QUESTION_MAX_LENGTH);
}
