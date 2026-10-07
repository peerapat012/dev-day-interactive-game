import { describe, expect, it } from "vitest";
import { hostPathForMode, modeLabel, otherMode } from "@/lib/roomMode";

describe("roomMode", () => {
  it("flips between modes", () => {
    expect(otherMode("wordcloud")).toBe("quiz");
    expect(otherMode("quiz")).toBe("wordcloud");
  });

  it("maps a mode to its host path", () => {
    expect(hostPathForMode("wordcloud")).toBe("/host");
    expect(hostPathForMode("quiz")).toBe("/quiz/host");
  });

  it("labels modes", () => {
    expect(modeLabel("quiz")).toBe("Quiz");
    expect(modeLabel("wordcloud")).toBe("Word Cloud");
  });
});
