import { describe, expect, it } from "vitest";
import { assertThaiSummaryContract } from "@/lib/validateThaiSummary";

describe("assertThaiSummaryContract", () => {
  it("accepts a Thai topic and Thai description", () => {
    expect(() =>
      assertThaiSummaryContract([
        {
          group: "food",
          topic: "อาหาร",
          summary: "กลุ่มนี้สนใจอาหารไทยและเมนูรสเผ็ด",
        },
      ]),
    ).not.toThrow();
  });

  it("allows an English topic when the description is Thai", () => {
    expect(() =>
      assertThaiSummaryContract([
        {
          group: "devops",
          topic: "DevOps",
          summary: "หัวข้อนี้เน้นระบบอัตโนมัติและการส่งมอบซอฟต์แวร์",
        },
      ]),
    ).not.toThrow();
  });

  it("rejects an English-only description", () => {
    expect(() =>
      assertThaiSummaryContract([
        {
          group: "food",
          topic: "อาหาร",
          summary: "This topic is about food.",
        },
      ]),
    ).toThrow("must have a Thai description");
  });
});
