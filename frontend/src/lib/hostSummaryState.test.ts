import { describe, expect, it } from "vitest";
import {
  deriveIsSummaryFromSummarizeJson,
  getDisplaySummaries,
  getSummaryTopicLabel,
  isSummaryTabEnabled,
  resolveHostLandingTab,
  resolveInitialSummaryAction,
  shouldAutoGenerateAfterEmptyState,
} from "@/lib/hostSummaryState";
import type { SummarizeResultItem } from "@/types/api";
import type { GroupStat } from "@/types/entry";

const GROUPS: GroupStat[] = [
  { group: "Food", count: 3, inputs: ["a", "b", "c"] },
  { group: "Tech", count: 2, inputs: ["d", "e"] },
  { group: "Music", count: 1, inputs: ["f"] },
];

const SUMMARIES: SummarizeResultItem[] = [
  { group: "Food", topic: "อาหาร", summary: "สรุปอาหาร" },
  { group: "Tech", topic: "เทคโนโลยี", summary: "สรุปเทคโนโลยี" },
  { group: "Music", topic: "ดนตรี", summary: "สรุปดนตรี" },
];

describe("resolveInitialSummaryAction", () => {
  it("shows a saved summary without generating again", () => {
    expect(
      resolveInitialSummaryAction(
        { groups: GROUPS, summaries: SUMMARIES, isSummary: true },
        5,
      ),
    ).toBe("show_saved");
  });

  it("auto-generates when entries exist but no saved summary", () => {
    expect(
      resolveInitialSummaryAction(
        { groups: [], summaries: [], isSummary: false },
        2,
      ),
    ).toBe("auto_generate");
  });

  it("shows empty when there are no entries and no saved summary", () => {
    expect(
      resolveInitialSummaryAction(
        { groups: [], summaries: [], isSummary: false },
        0,
      ),
    ).toBe("show_empty");
  });
});

describe("shouldAutoGenerateAfterEmptyState", () => {
  it("auto-generates when entries arrive after an empty waiting state", () => {
    expect(shouldAutoGenerateAfterEmptyState("empty", 2)).toBe(true);
  });

  it("does not regenerate while a saved summary is already shown", () => {
    expect(shouldAutoGenerateAfterEmptyState("ready", 2)).toBe(false);
  });

  it("stays idle when still waiting for the first submission", () => {
    expect(shouldAutoGenerateAfterEmptyState("empty", 0)).toBe(false);
  });
});

describe("isSummary transitions", () => {
  it("turns true when summarizeJson gains summaries and false when cleared", () => {
    expect(deriveIsSummaryFromSummarizeJson("[]")).toBe(false);
    expect(
      deriveIsSummaryFromSummarizeJson(JSON.stringify(SUMMARIES)),
    ).toBe(true);
    expect(isSummaryTabEnabled(true, 0)).toBe(true);
    expect(isSummaryTabEnabled(false, 0)).toBe(false);
  });

  it("keeps Start-new-round unlock via isSummary after inputs are cleared", () => {
    expect(isSummaryTabEnabled(true, 0)).toBe(true);
    expect(resolveHostLandingTab("summary", true, 0)).toBe("summary");
  });
});

describe("getDisplaySummaries", () => {
  it("orders summaries by top groups", () => {
    expect(getDisplaySummaries(GROUPS, SUMMARIES).map((item) => item.group)).toEqual(
      ["Food", "Tech", "Music"],
    );
  });
});

describe("getSummaryTopicLabel", () => {
  it("does not expose the internal classification key as display copy", () => {
    expect(
      getSummaryTopicLabel({ group: "internal-key", summary: "Summary text" }),
    ).toBe("Summary");
  });
});
