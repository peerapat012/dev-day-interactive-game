import { describe, expect, it, vi } from "vitest";
import { orchestrateHostSummary } from "@/lib/orchestrateHostSummary";

const ITEMS = [
  { id: "1", input: "React hooks", name: "Alice" },
  { id: "2", input: "Next.js routing", name: "Bob" },
  { id: "3", input: "Spicy ramen", name: "Carol" },
];

describe("orchestrateHostSummary", () => {
  it("classifies before summarizing and returns persistence data", async () => {
    const calls: string[] = [];
    const classify = vi.fn(async () => {
      calls.push("classify");
      return [
        { id: "1", group: "Frameworks" },
        { id: "2", group: "Frameworks" },
        { id: "3", group: "Food" },
      ];
    });
    const summarize = vi.fn(async () => {
      calls.push("summarize");
      return [
        {
          group: "Frameworks",
          topic: "เฟรมเวิร์ก",
          summary: "กลุ่มนี้สนใจ React และ Next.js สำหรับการพัฒนาเว็บ",
        },
        {
          group: "Food",
          topic: "อาหาร",
          summary: "หัวข้อนี้เน้นอาหารรสเผ็ดและราเมง",
        },
      ];
    });

    const result = await orchestrateHostSummary(ITEMS, {
      classify,
      summarize,
    });

    expect(calls).toEqual(["classify", "summarize"]);
    expect(classify).toHaveBeenCalledWith([
      { id: "1", input: "React hooks" },
      { id: "2", input: "Next.js routing" },
      { id: "3", input: "Spicy ramen" },
    ]);
    expect(summarize).toHaveBeenCalledWith([
      { group: "Frameworks", inputs: "React hooks, Next.js routing" },
      { group: "Food", inputs: "Spicy ramen" },
    ]);
    expect(result.entryGroups).toEqual([
      { id: "1", group: "Frameworks" },
      { id: "2", group: "Frameworks" },
      { id: "3", group: "Food" },
    ]);
    expect(result.groups).toEqual([
      {
        group: "Frameworks",
        count: 2,
        inputs: ["React hooks", "Next.js routing"],
        contributors: [
          { name: "Alice", input: "React hooks" },
          { name: "Bob", input: "Next.js routing" },
        ],
      },
      {
        group: "Food",
        count: 1,
        inputs: ["Spicy ramen"],
        contributors: [{ name: "Carol", input: "Spicy ramen" }],
      },
    ]);
    expect(result.summaries).toHaveLength(2);
  });

  it("falls back to Guest when a name is missing", async () => {
    const result = await orchestrateHostSummary(
      [{ id: "1", input: "React hooks" }],
      {
        classify: async () => [{ id: "1", group: "Frameworks" }],
        summarize: async () => [
          {
            group: "Frameworks",
            topic: "เฟรมเวิร์ก",
            summary: "กลุ่มนี้สนใจ React สำหรับการพัฒนาเว็บ",
          },
        ],
      },
    );

    expect(result.groups[0].contributors).toEqual([
      { name: "Guest", input: "React hooks" },
    ]);
  });

  it("does not summarize when classification fails", async () => {
    const summarize = vi.fn();

    await expect(
      orchestrateHostSummary(ITEMS, {
        classify: async () => {
          throw new Error("classification unavailable");
        },
        summarize,
      }),
    ).rejects.toThrow("classification unavailable");

    expect(summarize).not.toHaveBeenCalled();
  });

  it("rejects summaries that violate the Thai description contract", async () => {
    await expect(
      orchestrateHostSummary([ITEMS[0]], {
        classify: async () => [{ id: "1", group: "Frameworks" }],
        summarize: async () => [
          {
            group: "Frameworks",
            topic: "เฟรมเวิร์ก",
            summary: "English only description",
          },
        ],
      }),
    ).rejects.toThrow("must have a Thai description");
  });
});
