import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_VISIBLE_TOASTS, toast, useToastStore } from "./toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });
  afterEach(() => vi.useRealTimers());

  it("keeps only the newest toasts", () => {
    for (let i = 0; i < MAX_VISIBLE_TOASTS + 2; i++) toast.info(`m${i}`);
    const msgs = useToastStore.getState().toasts.map((t) => t.message);
    expect(msgs).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(msgs[msgs.length - 1]).toBe(`m${MAX_VISIBLE_TOASTS + 1}`);
  });

  it("auto-dismisses, errors later than others", () => {
    toast.success("ok");
    toast.error("bad");
    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(["bad"]);
    vi.advanceTimersByTime(2000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
