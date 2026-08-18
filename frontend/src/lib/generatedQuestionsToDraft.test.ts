import { describe, expect, it } from "vitest";
import { generatedQuestionsToDraft } from "@/lib/generatedQuestionsToDraft";

describe("generatedQuestionsToDraft", () => {
  it("maps options and wires the correct option id", () => {
    const drafts = generatedQuestionsToDraft([
      {
        prompt: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctOptionIndex: 1,
      },
    ]);

    expect(drafts).toHaveLength(1);
    const draft = drafts[0];
    expect(draft.prompt).toBe("What is 2 + 2?");
    expect(draft.options.map((o) => o.text)).toEqual(["3", "4", "5", "6"]);
    expect(draft.options[1].id).toBe(draft.correctOptionId);
  });

  it("defaults the time limit to 20s", () => {
    const drafts = generatedQuestionsToDraft([
      { prompt: "Q", options: ["a", "b"], correctOptionIndex: 0 },
    ]);
    expect(drafts[0].timeLimitMs).toBe(20000);
  });

  it("accepts a custom time limit", () => {
    const drafts = generatedQuestionsToDraft(
      [{ prompt: "Q", options: ["a", "b"], correctOptionIndex: 0 }],
      30000,
    );
    expect(drafts[0].timeLimitMs).toBe(30000);
  });

  it("falls back to the first option when the index is out of range", () => {
    const drafts = generatedQuestionsToDraft([
      { prompt: "Q", options: ["a", "b"], correctOptionIndex: 5 },
    ]);
    expect(drafts[0].correctOptionId).toBe(drafts[0].options[0].id);
  });

  it("gives each draft unique ids", () => {
    const drafts = generatedQuestionsToDraft([
      { prompt: "Q1", options: ["a", "b"], correctOptionIndex: 0 },
      { prompt: "Q2", options: ["a", "b"], correctOptionIndex: 1 },
    ]);
    const allIds = drafts.flatMap((d) => [
      d.id,
      ...d.options.map((o) => o.id),
    ]);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});