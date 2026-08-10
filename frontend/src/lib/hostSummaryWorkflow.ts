import type {
  HostSummaryGenerateItem,
  HostSummaryGenerateResponse,
} from "@/types/api";
import type { GroupStat } from "@/types/entry";

export type SummaryWorkflowEntry = HostSummaryGenerateItem;
export type SummaryWorkflowResult = HostSummaryGenerateResponse;
export type SummaryWorkflowStatus =
  | "loading_saved"
  | "generating"
  | "empty"
  | "error"
  | "ready";
export type SummarySnapshotOrigin = "refresh" | "round-complete";

export interface ActiveSummarySnapshot {
  entryIds: string[];
  groups: GroupStat[];
  summaries: SummaryWorkflowResult["summaries"];
}

export interface SummaryHistorySnapshot extends ActiveSummarySnapshot {
  savedAt: string;
  origin: SummarySnapshotOrigin;
}

export interface PersistedHostSummaryState {
  active: ActiveSummarySnapshot | null;
  history: SummaryHistorySnapshot[];
}

export interface CommitGenerationCommand {
  operationId: string;
  roomId: string;
  mode: "initial" | "refresh";
  capturedEntryIds: string[];
  result: SummaryWorkflowResult;
  previous: ActiveSummarySnapshot | null;
  history: SummaryHistorySnapshot[];
  /** Adapters must check this before each external write. */
  isCurrent: () => boolean;
}

export interface CompleteNewRoundCommand {
  operationId: string;
  roomId: string;
  previous: ActiveSummarySnapshot;
  history: SummaryHistorySnapshot[];
  /** Adapters must check this before each external write. */
  isCurrent: () => boolean;
}

export interface HostSummaryWorkflowPorts {
  load: (roomId: string) => Promise<PersistedHostSummaryState>;
  generate: (
    entries: SummaryWorkflowEntry[],
  ) => Promise<SummaryWorkflowResult>;
  /** Persist the entire logical generation commit idempotently. */
  commitGeneration: (command: CommitGenerationCommand) => Promise<void>;
  /** Archive, clear, and reset the round as one logical transition. */
  completeNewRound: (command: CompleteNewRoundCommand) => Promise<void>;
  now?: () => string;
}

export interface HostSummaryWorkflowState {
  status: SummaryWorkflowStatus;
  groups: GroupStat[];
  summaries: SummaryWorkflowResult["summaries"];
  snapshotEntryIds: string[];
  currentEntryCount: number;
  pendingEntryCount: number;
  error: string | null;
  busy: boolean;
  canRefresh: boolean;
  canStartNewRound: boolean;
}

type Listener = (state: HostSummaryWorkflowState) => void;
type PendingCommit = CommitGenerationCommand;

const EMPTY_STATE: HostSummaryWorkflowState = {
  status: "loading_saved",
  groups: [],
  summaries: [],
  snapshotEntryIds: [],
  currentEntryCount: 0,
  pendingEntryCount: 0,
  error: null,
  busy: false,
  canRefresh: false,
  canStartNewRound: false,
};
const MAX_HISTORY = 20;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function pendingCount(entries: SummaryWorkflowEntry[], snapshotEntryIds: string[]) {
  const captured = new Set(snapshotEntryIds);
  return entries.reduce((count, entry) => count + (captured.has(entry.id) ? 0 : 1), 0);
}

function createState(
  partial: Partial<HostSummaryWorkflowState>,
): HostSummaryWorkflowState {
  const next = { ...EMPTY_STATE, ...partial };
  const hasSummary = next.summaries.length > 0;
  return {
    ...next,
    canRefresh: !next.busy && next.status === "ready" && hasSummary,
    canStartNewRound: !next.busy && next.status === "ready" && hasSummary,
  };
}

export function createHostSummaryWorkflow(ports: HostSummaryWorkflowPorts) {
  let state = createState({});
  let roomId = "";
  let entries: SummaryWorkflowEntry[] = [];
  let active: ActiveSummarySnapshot | null = null;
  let history: SummaryHistorySnapshot[] = [];
  let pendingCommit: PendingCommit | null = null;
  let pendingNewRound: CompleteNewRoundCommand | null = null;
  let operationNumber = 0;
  const listeners = new Set<Listener>();

  function emit(next: Partial<HostSummaryWorkflowState>) {
    state = createState({ ...state, ...next });
    listeners.forEach((listener) => listener(state));
  }

  function nextOperation() {
    operationNumber += 1;
    return `host-summary-${operationNumber}`;
  }

  function isCurrent(targetRoomId: string, operationId: string) {
    return roomId === targetRoomId && operationId === `host-summary-${operationNumber}`;
  }

  function stateForActive(
    target: ActiveSummarySnapshot | null,
    overrides: Partial<HostSummaryWorkflowState> = {},
  ) {
    return {
      groups: target?.groups ?? [],
      summaries: target?.summaries ?? [],
      snapshotEntryIds: target?.entryIds ?? [],
      currentEntryCount: entries.length,
      pendingEntryCount: target
        ? pendingCount(entries, target.entryIds)
        : 0,
      ...overrides,
    };
  }

  function historyWithSnapshot(
    snapshot: ActiveSummarySnapshot,
    origin: SummarySnapshotOrigin,
  ): SummaryHistorySnapshot[] {
    return [
      {
        ...snapshot,
        savedAt: ports.now?.() ?? new Date().toISOString(),
        origin,
      },
      ...history,
    ].slice(0, MAX_HISTORY);
  }

  function clearAfterNewRound() {
    pendingNewRound = null;
    active = null;
    entries = [];
    emit({
      status: "empty",
      groups: [],
      summaries: [],
      snapshotEntryIds: [],
      currentEntryCount: 0,
      pendingEntryCount: 0,
      error: null,
      busy: false,
    });
  }

  async function commitGenerated(
    command: CommitGenerationCommand,
  ): Promise<void> {
    pendingCommit = command;
    try {
      await ports.commitGeneration(command);
    } catch (error) {
      if (isCurrent(command.roomId, command.operationId)) {
        emit(
          stateForActive(command.previous, {
            status: "error",
            error: errorMessage(error, "Could not persist summary"),
            busy: false,
          }),
        );
      }
      throw error;
    }

    if (!isCurrent(command.roomId, command.operationId)) return;

    pendingCommit = null;
    history = command.history;
    active = {
      entryIds: [...command.capturedEntryIds],
      groups: command.result.groups,
      summaries: command.result.summaries,
    };
    emit(
      stateForActive(active, {
        status: "ready",
        error: null,
        busy: false,
      }),
    );
  }

  async function generate(
    targetRoomId: string,
    operationId: string,
    mode: "initial" | "refresh",
    previous: ActiveSummarySnapshot | null,
  ) {
    const capturedEntries = entries.map((entry) => ({ ...entry }));
    if (capturedEntries.length === 0) {
      if (isCurrent(targetRoomId, operationId)) {
        emit(
          stateForActive(previous, {
            status: "error",
            error: "No submissions are available to generate a summary.",
            busy: false,
          }),
        );
      }
      return;
    }

    emit(
      stateForActive(previous, {
        status: "generating",
        error: null,
        busy: true,
      }),
    );

    let result: SummaryWorkflowResult;
    try {
      result = await ports.generate(capturedEntries);
    } catch (error) {
      if (isCurrent(targetRoomId, operationId)) {
        emit(
          stateForActive(previous, {
            status: "error",
            error: errorMessage(error, "Could not generate summary"),
            busy: false,
          }),
        );
      }
      return;
    }

    if (!isCurrent(targetRoomId, operationId)) return;

    await commitGenerated({
      operationId,
      roomId: targetRoomId,
      mode,
      capturedEntryIds: capturedEntries.map((entry) => entry.id),
      result,
      previous,
      history:
        mode === "refresh" && previous
          ? historyWithSnapshot(previous, "refresh")
          : history,
      isCurrent: () => isCurrent(targetRoomId, operationId),
    }).catch(() => undefined);
  }

  async function open(
    targetRoomId: string,
    nextEntries: SummaryWorkflowEntry[],
  ): Promise<void> {
    roomId = targetRoomId;
    entries = nextEntries.map((entry) => ({ ...entry }));
    active = null;
    pendingCommit = null;
    pendingNewRound = null;
    const operationId = nextOperation();
    emit({
      status: "loading_saved",
      groups: [],
      summaries: [],
      snapshotEntryIds: [],
      currentEntryCount: entries.length,
      pendingEntryCount: 0,
      error: null,
      busy: true,
    });

    let persisted: PersistedHostSummaryState;
    try {
      persisted = await ports.load(targetRoomId);
    } catch (error) {
      if (isCurrent(targetRoomId, operationId)) {
        emit({
          status: "error",
          error: errorMessage(error, "Could not load summary"),
          busy: false,
        });
      }
      return;
    }

    if (!isCurrent(targetRoomId, operationId)) return;

    active = persisted.active;
    history = persisted.history.slice(0, MAX_HISTORY);
    if (active) {
      emit(
        stateForActive(active, {
          status: "ready",
          error: null,
          busy: false,
        }),
      );
      return;
    }

    if (entries.length === 0) {
      emit({
        status: "empty",
        currentEntryCount: 0,
        pendingEntryCount: 0,
        error: null,
        busy: false,
      });
      return;
    }

    await generate(targetRoomId, operationId, "initial", null);
  }

  function setEntries(nextEntries: SummaryWorkflowEntry[]) {
    entries = nextEntries.map((entry) => ({ ...entry }));
    emit({
      currentEntryCount: entries.length,
      pendingEntryCount: active ? pendingCount(entries, active.entryIds) : 0,
    });
  }

  async function refresh(): Promise<void> {
    if (state.busy || state.status !== "ready" || !active) return;
    const operationId = nextOperation();
    await generate(roomId, operationId, "refresh", active);
  }

  async function completeNewRound(command: CompleteNewRoundCommand) {
    pendingNewRound = command;
    emit(stateForActive(command.previous, { status: "ready", busy: true, error: null }));

    try {
      await ports.completeNewRound(command);
      if (!isCurrent(command.roomId, command.operationId)) return;
      history = command.history;
      clearAfterNewRound();
    } catch (error) {
      if (isCurrent(command.roomId, command.operationId)) {
        emit(
          stateForActive(command.previous, {
            status: "error",
            error: errorMessage(error, "Could not start new round"),
            busy: false,
          }),
        );
      }
    }
  }

  async function retry(): Promise<void> {
    if (state.busy) return;

    if (pendingCommit) {
      const commit = pendingCommit;
      emit(stateForActive(commit.previous, { status: "generating", busy: true, error: null }));
      await commitGenerated(commit).catch(() => undefined);
      return;
    }

    if (pendingNewRound) {
      const command = pendingNewRound;
      await completeNewRound(command);
      return;
    }

    const operationId = nextOperation();
    await generate(roomId, operationId, active ? "refresh" : "initial", active);
  }

  async function startNewRound(): Promise<void> {
    if (state.busy || state.status !== "ready" || !active) return;

    const operationId = nextOperation();
    const command: CompleteNewRoundCommand = {
      operationId,
      roomId,
      previous: active,
      history: historyWithSnapshot(active, "round-complete"),
      isCurrent: () => isCurrent(roomId, operationId),
    };
    await completeNewRound(command);
  }

  return {
    getState: () => state,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open,
    setEntries,
    refresh,
    retry,
    startNewRound,
  };
}
