import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { CLASSIFY_BATCH_PROMPT, SUMMARIZE_PROMPT } from "@/services/ai/prompts";

describe("word cloud prompts", () => {
  it("classifies answers to the round question without forcing variety", () => {
    expect(CLASSIFY_BATCH_PROMPT).toContain('"question"');
    expect(CLASSIFY_BATCH_PROMPT).toContain("นอกประเด็น");
    expect(CLASSIFY_BATCH_PROMPT).not.toMatch(/at least 3/i);
    expect(CLASSIFY_BATCH_PROMPT).not.toContain("Frameworks");
  });

  it("summarizes what the group answers using only its own inputs", () => {
    expect(SUMMARIZE_PROMPT).toContain('"question"');
    expect(SUMMARIZE_PROMPT).toMatch(/only ideas that appear/i);
    expect(SUMMARIZE_PROMPT).not.toMatch(/especially interested/i);
  });
});
