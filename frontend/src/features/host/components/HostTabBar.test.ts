import { describe, expect, it } from "vitest";
import { HOST_TABS } from "@/features/host/components/HostTabBar";
import {
  deriveIsSummaryFromSummarizeJson,
  isSummaryTabEnabled,
  resolveHostLandingTab,
} from "@/lib/hostSummaryState";

describe("host navigation", () => {
  it("routes the host directly from inputs to Summary without a Groups tab", () => {
    expect(HOST_TABS).toEqual([
      { id: "room", label: "Room" },
      { id: "inputs", label: "Inputs" },
      { id: "summary", label: "Summary" },
    ]);
  });
});

describe("isSummaryTabEnabled", () => {
  it("disables Summary when there is no saved summary and no guest inputs", () => {
    expect(isSummaryTabEnabled(false, 0)).toBe(false);
  });

  it("enables Summary when guest inputs exist without a saved summary", () => {
    expect(isSummaryTabEnabled(false, 2)).toBe(true);
  });

  it("enables Summary when a saved summary exists", () => {
    expect(isSummaryTabEnabled(true, 0)).toBe(true);
    expect(isSummaryTabEnabled(true, 4)).toBe(true);
  });
});

describe("resolveHostLandingTab", () => {
  it("falls back to Room when Summary would open while disabled", () => {
    expect(resolveHostLandingTab("summary", false, 0)).toBe("room");
  });

  it("keeps Summary when inputs or a saved summary unlock the tab", () => {
    expect(resolveHostLandingTab("summary", false, 1)).toBe("summary");
    expect(resolveHostLandingTab("summary", true, 0)).toBe("summary");
  });
});

describe("deriveIsSummaryFromSummarizeJson", () => {
  it("derives true from a non-empty summarizeJson array", () => {
    expect(
      deriveIsSummaryFromSummarizeJson(
        JSON.stringify([{ group: "Food", topic: "อาหาร", summary: "สรุป" }]),
      ),
    ).toBe(true);
  });

  it("derives false from empty or invalid summarizeJson", () => {
    expect(deriveIsSummaryFromSummarizeJson("[]")).toBe(false);
    expect(deriveIsSummaryFromSummarizeJson("")).toBe(false);
    expect(deriveIsSummaryFromSummarizeJson("not-json")).toBe(false);
  });
});
