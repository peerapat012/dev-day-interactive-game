import { describe, expect, it, vi } from "vitest";
import {
  createHostSummaryWorkflow,
  type HostSummaryWorkflowPorts,
  type SummaryWorkflowEntry,
  type SummaryWorkflowResult,
} from "@/lib/hostSummaryWorkflow";

const ENTRIES: SummaryWorkflowEntry[] = [
  { id: "entry-1", input: "React", name: "Alice" },
  { id: "entry-2", input: "Ramen", name: "Bob" },
];

const RESULT: SummaryWorkflowResult = {
  entryGroups: [
    { id: "entry-1", group: "programming" },
    { id: "entry-2", group: "food" },
  ],
  groups: [
    {
      group: "programming",
      count: 1,
      inputs: ["React"],
      contributors: [{ name: "Alice", input: "React" }],
    },
    {
      group: "food",
      count: 1,
      inputs: ["Ramen"],
      contributors: [{ name: "Bob", input: "Ramen" }],
    },
  ],
  summaries: [
    { group: "programming", topic: "Programming", summary: "React" },
    { group: "food", topic: "Food", summary: "Ramen" },
  ],
};

function makePorts(
  overrides: Partial<HostSummaryWorkflowPorts> = {},
): HostSummaryWorkflowPorts {
  return {
    load: vi.fn(async () => ({ active: null, history: [] })),
    generate: vi.fn(async () => RESULT),
    commitGeneration: vi.fn(async () => undefined),
    completeNewRound: vi.fn(async () => undefined),
    ...overrides,
  };
}

function makeMemoryPersistencePorts() {
  let failCommit = false;
  const persisted = {
    active: null as {
      entryIds: string[];
      groups: SummaryWorkflowResult["groups"];
      summaries: SummaryWorkflowResult["summaries"];
    } | null,
    history: [] as Array<{
      entryIds: string[];
      groups: SummaryWorkflowResult["groups"];
      summaries: SummaryWorkflowResult["summaries"];
      savedAt: string;
      origin: "refresh" | "round-complete";
    }>,
  };
  const ports = makePorts({
    load: vi.fn(async () => persisted),
    now: vi.fn(() => "now"),
    commitGeneration: vi.fn(async (command) => {
      if (failCommit) throw new Error("commit failed");
      if (!command.isCurrent()) return;
      persisted.active = {
        entryIds: command.capturedEntryIds,
        groups: command.result.groups,
        summaries: command.result.summaries,
      };
      persisted.history = command.history;
    }),
    completeNewRound: vi.fn(async (command) => {
      if (!command.isCurrent()) return;
      persisted.active = null;
      persisted.history = command.history;
    }),
  });
  return {
    ports,
    persisted,
    failCommit: (value: boolean) => {
      failCommit = value;
    },
  };
}

describe("host summary workflow", () => {
  it("generates the first active summary when Summary opens with entries", async () => {
    const ports = makePorts();
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", ENTRIES);

    expect(ports.generate).toHaveBeenCalledWith(ENTRIES);
    expect(workflow.getState()).toMatchObject({
      status: "ready",
      currentEntryCount: 2,
      pendingEntryCount: 0,
      snapshotEntryIds: ["entry-1", "entry-2"],
    });
  });

  it("does not generate when guests submit while the host is not viewing Summary", async () => {
    const ports = makePorts();
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", []);
    workflow.setEntries(ENTRIES);

    expect(ports.generate).not.toHaveBeenCalled();
    expect(workflow.getState()).toMatchObject({
      status: "empty",
      currentEntryCount: 2,
    });
  });

  it("keeps a ready snapshot stable and reports entries submitted afterward as pending", async () => {
    const ports = makePorts();
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", [ENTRIES[0]]);
    workflow.setEntries(ENTRIES);

    expect(ports.generate).toHaveBeenCalledTimes(1);
    expect(workflow.getState()).toMatchObject({
      status: "ready",
      pendingEntryCount: 1,
      summaries: RESULT.summaries,
    });
  });

  it("refreshes from the current entry snapshot and clears pending entries", async () => {
    const ports = makePorts();
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", [ENTRIES[0]]);
    workflow.setEntries(ENTRIES);
    await workflow.refresh();

    expect(ports.generate).toHaveBeenNthCalledWith(2, ENTRIES);
    expect(ports.commitGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "refresh",
        capturedEntryIds: ["entry-1", "entry-2"],
        previous: expect.objectContaining({
          entryIds: ["entry-1"],
        }),
      }),
    );
    expect(workflow.getState()).toMatchObject({ pendingEntryCount: 0 });
  });

  it("builds capped history with explicit snapshot origins", async () => {
    const oldHistory = Array.from({ length: 20 }, (_, index) => ({
      ...RESULT,
      entryIds: [`old-${index}`],
      savedAt: `old-${index}`,
      origin: "refresh" as const,
    }));
    const ports = makePorts({
      load: vi.fn(async () => ({
        active: { entryIds: ["entry-1", "entry-2"], ...RESULT },
        history: oldHistory,
      })),
      now: vi.fn(() => "now"),
    });
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", ENTRIES);
    await workflow.refresh();

    const refreshCommand = vi.mocked(ports.commitGeneration).mock.calls[0]?.[0];
    expect(refreshCommand?.history).toHaveLength(20);
    expect(refreshCommand?.history[0]).toMatchObject({
      origin: "refresh",
      savedAt: "now",
    });

    await workflow.startNewRound();
    const newRoundCommand = vi.mocked(ports.completeNewRound).mock.calls[0]?.[0];
    expect(newRoundCommand?.history[0]).toMatchObject({
      origin: "round-complete",
      savedAt: "now",
    });
  });

  it("keeps durable history unchanged on failed refresh and archives once on success", async () => {
    const memory = makeMemoryPersistencePorts();
    const workflow = createHostSummaryWorkflow(memory.ports);

    await workflow.open("room-1", ENTRIES);
    const beforeRefresh = JSON.parse(JSON.stringify(memory.persisted));
    memory.failCommit(true);
    await workflow.refresh();
    expect(memory.persisted).toEqual(beforeRefresh);

    memory.failCommit(false);
    await workflow.retry();
    expect(memory.persisted.history).toHaveLength(1);
    expect(memory.persisted.history[0]).toMatchObject({
      origin: "refresh",
      savedAt: "now",
    });

    await workflow.startNewRound();
    expect(memory.persisted.active).toBeNull();
    expect(memory.persisted.history).toHaveLength(2);
    expect(memory.persisted.history[0]?.origin).toBe("round-complete");
  });

  it("ignores a stale generation after the host changes rooms", async () => {
    let resolveGeneration!: (result: SummaryWorkflowResult) => void;
    const generation = new Promise<SummaryWorkflowResult>((resolve) => {
      resolveGeneration = resolve;
    });
    const ports = makePorts({ generate: vi.fn(async () => generation) });
    const workflow = createHostSummaryWorkflow(ports);

    const roomOne = workflow.open("room-1", ENTRIES);
    await workflow.open("room-2", []);
    resolveGeneration(RESULT);
    await roomOne;

    expect(ports.commitGeneration).not.toHaveBeenCalled();
    expect(workflow.getState()).toMatchObject({
      status: "empty",
    });
  });

  it("marks an in-flight persistence command stale when the room changes", async () => {
    let resolveCommit!: () => void;
    const commit = new Promise<void>((resolve) => {
      resolveCommit = resolve;
    });
    let commandIsCurrent!: () => boolean;
    const ports = makePorts({
      commitGeneration: vi.fn(async (command) => {
        commandIsCurrent = command.isCurrent;
        await commit;
      }),
    });
    const workflow = createHostSummaryWorkflow(ports);

    const roomOne = workflow.open("room-1", ENTRIES);
    await vi.waitFor(() => expect(commandIsCurrent).toBeTypeOf("function"));
    await workflow.open("room-2", []);
    expect(commandIsCurrent()).toBe(false);
    resolveCommit();
    await roomOne;
  });

  it("retries a partial persistence failure with the same generated result", async () => {
    const commitGeneration = vi
      .fn<HostSummaryWorkflowPorts["commitGeneration"]>()
      .mockRejectedValueOnce(new Error("entry write failed"))
      .mockResolvedValueOnce(undefined);
    const ports = makePorts({ commitGeneration });
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", ENTRIES);
    expect(workflow.getState()).toMatchObject({ status: "error" });

    await workflow.retry();

    expect(ports.generate).toHaveBeenCalledTimes(1);
    expect(commitGeneration).toHaveBeenCalledTimes(2);
    expect(commitGeneration.mock.calls[0]?.[0]).toEqual(
      commitGeneration.mock.calls[1]?.[0],
    );
    expect(workflow.getState()).toMatchObject({ status: "ready" });
  });

  it("requires a ready summary before starting a new round", async () => {
    const ports = makePorts();
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", []);
    await workflow.startNewRound();
    expect(ports.completeNewRound).not.toHaveBeenCalled();

    await workflow.open("room-1", ENTRIES);
    await workflow.startNewRound();

    expect(ports.completeNewRound).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: "room-1",
        previous: expect.objectContaining({ entryIds: ["entry-1", "entry-2"] }),
      }),
    );
    expect(workflow.getState()).toMatchObject({
      status: "empty",
      currentEntryCount: 0,
      pendingEntryCount: 0,
    });
  });

  it("preserves the active summary when starting a new round fails", async () => {
    const ports = makePorts({
      completeNewRound: vi.fn(async () => {
        throw new Error("reset failed");
      }),
    });
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", ENTRIES);
    await workflow.startNewRound();

    expect(workflow.getState()).toMatchObject({
      status: "error",
      summaries: RESULT.summaries,
      currentEntryCount: ENTRIES.length,
    });
  });

  it("does not start a competing new round while refresh is busy", async () => {
    let resolveGeneration!: (result: SummaryWorkflowResult) => void;
    const generation = new Promise<SummaryWorkflowResult>((resolve) => {
      resolveGeneration = resolve;
    });
    const generate = vi
      .fn<HostSummaryWorkflowPorts["generate"]>()
      .mockResolvedValueOnce(RESULT)
      .mockImplementationOnce(async () => generation);
    const ports = makePorts({ generate });
    const workflow = createHostSummaryWorkflow(ports);

    await workflow.open("room-1", ENTRIES);
    const refreshing = workflow.refresh();
    await vi.waitFor(() => expect(workflow.getState().busy).toBe(true));
    await workflow.startNewRound();
    expect(ports.completeNewRound).not.toHaveBeenCalled();
    resolveGeneration(RESULT);
    await refreshing;
  });
});
