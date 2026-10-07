import { describe, expect, it } from "vitest";
import {
  findUnknownOptionalColumns,
  withoutColumns,
} from "@/lib/roomOptionalColumns";

describe("roomOptionalColumns", () => {
  it("detects an unknown roundQuestion attribute", () => {
    const error = new Error('Invalid document structure: Unknown attribute: "roundQuestion"');
    expect(findUnknownOptionalColumns(error)).toEqual(["roundQuestion"]);
  });

  it("detects an unknown isSummary attribute", () => {
    const error = new Error("Invalid document structure: Unknown attribute: isSummary");
    expect(findUnknownOptionalColumns(error)).toEqual(["isSummary"]);
  });

  it("ignores unrelated errors", () => {
    expect(findUnknownOptionalColumns(new Error("Network request failed"))).toEqual([]);
    expect(findUnknownOptionalColumns(new Error("Unknown attribute: other"))).toEqual([]);
  });

  it("strips only the requested columns", () => {
    const data = { roomId: "ABC", roundQuestion: "q", isSummary: true };
    expect(withoutColumns(data, ["roundQuestion"])).toEqual({ roomId: "ABC", isSummary: true });
    expect(data.roundQuestion).toBe("q");
  });
});
