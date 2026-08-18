import { describe, expect, it } from "vitest";
import { parseGenerateQuestionsResponse } from "@/services/ai/parseGenerateQuestionsResponse";

describe("parseGenerateQuestionsResponse", () => {
  it("parses a questions array under the questions key", () => {
    const result = parseGenerateQuestionsResponse({
      questions: [
        {
          prompt: "What is the capital of France?",
          options: ["Paris", "London", "Berlin", "Madrid"],
          correctOptionIndex: 0,
        },
      ],
    });
    expect(result).toEqual([
      {
        prompt: "What is the capital of France?",
        options: ["Paris", "London", "Berlin", "Madrid"],
        correctOptionIndex: 0,
      },
    ]);
  });

  it("parses a top-level array", () => {
    const result = parseGenerateQuestionsResponse([
      {
        prompt: "Q1",
        options: ["a", "b", "c"],
        correctOptionIndex: 2,
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].correctOptionIndex).toBe(2);
  });

  it("falls back to index 0 when correctOptionIndex is missing or invalid", () => {
    const result = parseGenerateQuestionsResponse({
      questions: [
        { prompt: "Missing index", options: ["a", "b"] },
        { prompt: "Out of range", options: ["a", "b"], correctOptionIndex: 9 },
        { prompt: "Negative", options: ["a", "b"], correctOptionIndex: -1 },
      ],
    });
    expect(result.map((q) => q.correctOptionIndex)).toEqual([0, 0, 0]);
  });

  it("accepts options as a comma-separated string", () => {
    const result = parseGenerateQuestionsResponse({
      questions: [
        { prompt: "Q", options: "a,b,c,d", correctOptionIndex: 1 },
      ],
    });
    expect(result[0].options).toEqual(["a", "b", "c", "d"]);
  });

  it("throws when a question has fewer than two options", () => {
    expect(() =>
      parseGenerateQuestionsResponse({
        questions: [{ prompt: "Q", options: ["only one"] }],
      }),
    ).toThrow(/at least two options/);
  });

  it("throws when no questions array is present", () => {
    expect(() => parseGenerateQuestionsResponse({ nope: 1 })).toThrow(
      /could not find questions array/,
    );
  });

  it("throws on an empty body", () => {
    expect(() => parseGenerateQuestionsResponse(null)).toThrow(/empty/);
  });
});