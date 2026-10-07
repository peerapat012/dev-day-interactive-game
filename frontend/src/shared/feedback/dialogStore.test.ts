import { beforeEach, describe, expect, it } from "vitest";
import { alertDialog, confirmDialog, useDialogStore } from "./dialogStore";

describe("dialogStore", () => {
  beforeEach(() => useDialogStore.setState({ queue: [] }));

  it("resolves confirm with the chosen result", async () => {
    const p = confirmDialog({ title: "t", message: "m" });
    useDialogStore.getState().resolveHead(true);
    await expect(p).resolves.toBe(true);
  });

  it("shows dialogs one at a time in order", async () => {
    const first = confirmDialog({ title: "a", message: "a" });
    const second = alertDialog({ title: "b", message: "b" });
    expect(useDialogStore.getState().queue.map((d) => d.title)).toEqual(["a", "b"]);
    useDialogStore.getState().resolveHead(false);
    await expect(first).resolves.toBe(false);
    expect(useDialogStore.getState().queue[0]?.title).toBe("b");
    useDialogStore.getState().resolveHead(true);
    await expect(second).resolves.toBeUndefined();
  });
});
