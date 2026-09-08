import { describe, expect, it } from "vitest";
import {
  addDraftOption,
  generatedQuestionsToDraft,
  MAX_DRAFT_OPTIONS,
  MIN_DRAFT_OPTIONS,
  removeDraftOption,
  type DraftQuestion,
} from "@/lib/generatedQuestionsToDraft";

function draftQuestion(optionTexts: string[], correctIndex = 0): DraftQuestion {
  const options = optionTexts.map((text, index) => ({
    id: `opt-${index}`,
    text,
  }));
  return {
    id: "q1",
    prompt: "Q",
    options,
    correctOptionId: options[correctIndex]?.id ?? "",
    timeLimitMs: 20000,
  };
}

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

describe("addDraftOption", () => {
  it("appends an empty option without changing the correct option", () => {
    const question = draftQuestion(["A", "B"], 1);
    const next = addDraftOption(question);
    expect(next.options.map((option) => option.text)).toEqual(["A", "B", ""]);
    expect(next.correctOptionId).toBe("opt-1");
    expect(next.options[2].id).not.toBe("opt-0");
    expect(next.options[2].id).not.toBe("opt-1");
  });

  it("does not add past the max option count", () => {
    const texts = Array.from({ length: MAX_DRAFT_OPTIONS }, (_, i) => `O${i}`);
    const question = draftQuestion(texts);
    const next = addDraftOption(question);
    expect(next).toBe(question);
    expect(next.options).toHaveLength(MAX_DRAFT_OPTIONS);
  });
});

describe("removeDraftOption", () => {
  it("drops the option and keeps the correct option when it remains", () => {
    const question = draftQuestion(["A", "B", "C"], 0);
    const next = removeDraftOption(question, "opt-2");
    expect(next.options.map((option) => option.text)).toEqual(["A", "B"]);
    expect(next.correctOptionId).toBe("opt-0");
  });

  it("moves the correct option to the first remaining option when the correct one is removed", () => {
    const question = draftQuestion(["A", "B", "C"], 1);
    const next = removeDraftOption(question, "opt-1");
    expect(next.options.map((option) => option.id)).toEqual(["opt-0", "opt-2"]);
    expect(next.correctOptionId).toBe("opt-0");
  });

  it("does not remove below the min option count", () => {
    const question = draftQuestion(
      Array.from({ length: MIN_DRAFT_OPTIONS }, (_, i) => `O${i}`),
    );
    const next = removeDraftOption(question, "opt-0");
    expect(next).toBe(question);
    expect(next.options).toHaveLength(MIN_DRAFT_OPTIONS);
  });
});
