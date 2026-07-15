import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAndSaveHostSummary } from "@/services/ai/generateHostSummary";
import { updateEntry } from "@/services/appwrite/entries";
import { updateRoomSnapshot } from "@/services/appwrite/rooms";

vi.mock("@/services/appwrite/entries", () => ({
  updateEntry: vi.fn(),
}));
vi.mock("@/services/appwrite/rooms", () => ({
  updateRoomSnapshot: vi.fn(),
}));

describe("generateAndSaveHostSummary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes the active snapshot without appending summary history", async () => {
    const generated = {
      entryGroups: [{ id: "entry-1", group: "Food" }],
      groups: [{ group: "Food", count: 1, inputs: ["Spicy ramen"] }],
      summaries: [
        {
          group: "Food",
          topic: "อาหาร",
          summary: "หัวข้อนี้เน้นอาหารรสเผ็ดและราเมง",
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(generated), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await generateAndSaveHostSummary("room-row-1", {
      items: [{ id: "entry-1", input: "Spicy ramen" }],
    });

    expect(updateEntry).toHaveBeenCalledWith("entry-1", { group: "Food" });
    expect(updateRoomSnapshot).toHaveBeenCalledWith("room-row-1", {
      groups: generated.groups,
      summaries: generated.summaries,
    });
  });
});
