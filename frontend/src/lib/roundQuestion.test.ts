import { describe, expect, it } from "vitest";
import { ROUND_QUESTION_MAX_LENGTH } from "@/lib/constants";
import { normalizeRoundQuestion } from "@/lib/roundQuestion";

describe("normalizeRoundQuestion", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeRoundQuestion("  กังวลอะไร  ")).toBe("กังวลอะไร");
  });

  it("returns an empty string for missing or blank input", () => {
    expect(normalizeRoundQuestion(undefined)).toBe("");
    expect(normalizeRoundQuestion("   ")).toBe("");
  });

  it("clamps to the maximum length", () => {
    expect(normalizeRoundQuestion("ก".repeat(ROUND_QUESTION_MAX_LENGTH + 50))).toHaveLength(
      ROUND_QUESTION_MAX_LENGTH,
    );
  });
});
