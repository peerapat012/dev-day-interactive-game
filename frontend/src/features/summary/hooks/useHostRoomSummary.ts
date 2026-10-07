"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTopGroups } from "@/lib/aggregateEntries";
import { normalizeRoundQuestion } from "@/lib/roundQuestion";
import { TOP_GROUPS_COUNT } from "@/lib/constants";
import {
  getDisplaySummaries,
  resolveInitialSummaryAction,
  shouldAutoGenerateAfterEmptyState,
} from "@/lib/hostSummaryState";
import {
  getRoomSnapshot,
  saveRoomRound,
  startNewRound,
} from "@/services/appwrite/rooms";
import { generateAndSaveHostSummary } from "@/services/ai/generateHostSummary";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";
import type { SummarizeResultItem } from "@/types/api";
import type { GroupStat } from "@/types/entry";

export type HostSummaryStatus =
  | "loading_saved"
  | "generating"
  | "empty"
  | "error"
  | "ready";

interface SummaryState {
  status: HostSummaryStatus;
  groups: GroupStat[];
  summaries: SummarizeResultItem[];
  /** Round question the active summary was generated for ("" when none). */
  question: string;
  error: string | null;
}

const INITIAL_STATE: SummaryState = {
  status: "loading_saved",
  groups: [],
  summaries: [],
  question: "",
  error: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useHostRoomSummary() {
  const entries = useEntriesStore((s) => s.entries);
  const setEntriesForRoom = useEntriesStore((s) => s.setEntriesForRoom);
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const roomId = useRoomStore((s) => s.roomId);
  const roomRowId = useRoomStore((s) => s.roomRowId);
  const setIsSummary = useRoomStore((s) => s.setIsSummary);

  const [state, setState] = useState<SummaryState>(INITIAL_STATE);
  const [isResetting, setIsResetting] = useState(false);
  const initializedRoomsRef = useRef(new Set<string>());
  const stateByRoomRef = useRef(new Map<string, SummaryState>());
  const mountedRef = useRef(false);
  const operationRef = useRef(0);
  const busyRef = useRef(false);

  const roomEntries = useMemo(
    () => (roomId ? entries.filter((e) => e.roomId === roomId) : []),
    [entries, roomId],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const commitState = useCallback(
    (targetRoomRowId: string, operation: number, nextState: SummaryState) => {
      if (
        !mountedRef.current ||
        useRoomStore.getState().roomRowId !== targetRoomRowId ||
        operationRef.current !== operation
      ) {
        return;
      }
      stateByRoomRef.current.set(targetRoomRowId, nextState);
      setState(nextState);
    },
    [],
  );

  const resolveSavedOrGenerate = useCallback(
    async (targetRoomRowId: string, operation: number) => {
      commitState(targetRoomRowId, operation, INITIAL_STATE);

      try {
        const snapshot = await getRoomSnapshot(targetRoomRowId);
        const currentRoomId = useRoomStore.getState().roomId;
        const currentEntriesState = useEntriesStore.getState().entries;
        const currentEntries = currentRoomId
          ? currentEntriesState.filter((entry) => entry.roomId === currentRoomId)
          : [];
        const initialAction = resolveInitialSummaryAction(
          snapshot,
          currentEntries.length,
        );

        if (initialAction === "show_saved") {
          setIsSummary(true);
          commitState(targetRoomRowId, operation, {
            status: "ready",
            groups: snapshot.groups,
            summaries: snapshot.summaries,
            question: snapshot.roundQuestion ?? "",
            error: null,
          });
          return;
        }

        if (initialAction === "show_empty") {
          setIsSummary(false);
          commitState(targetRoomRowId, operation, {
            status: "empty",
            groups: [],
            summaries: [],
            question: snapshot.roundQuestion ?? "",
            error: null,
          });
          return;
        }

        const question = snapshot.roundQuestion ?? "";
        commitState(targetRoomRowId, operation, {
          status: "generating",
          groups: [],
          summaries: [],
          question,
          error: null,
        });
        const result = await generateAndSaveHostSummary(targetRoomRowId, {
          items: currentEntries.map((entry) => ({
            id: entry.$id,
            input: entry.input,
            name: entry.name,
          })),
          question,
        });
        setIsSummary(true);
        commitState(targetRoomRowId, operation, {
          status: "ready",
          groups: result.groups,
          summaries: result.summaries,
          question,
          error: null,
        });
      } catch (error) {
        commitState(targetRoomRowId, operation, {
          status: "error",
          groups: [],
          summaries: [],
          question: "",
          error: getErrorMessage(error, "Failed to load or generate summary"),
        });
      } finally {
        if (operationRef.current === operation) {
          busyRef.current = false;
        }
      }
    },
    [commitState, setIsSummary],
  );

  useEffect(() => {
    if (!isHydrated || !roomRowId) return;

    const cachedState = stateByRoomRef.current.get(roomRowId);
    if (initializedRoomsRef.current.has(roomRowId)) {
      if (cachedState) setState(cachedState);
      return;
    }

    initializedRoomsRef.current.add(roomRowId);
    busyRef.current = true;
    const operation = ++operationRef.current;
    void resolveSavedOrGenerate(roomRowId, operation);
  }, [isHydrated, roomRowId, resolveSavedOrGenerate]);

  useEffect(() => {
    if (!isHydrated || !roomRowId || busyRef.current) return;
    if (!shouldAutoGenerateAfterEmptyState(state.status, roomEntries.length)) return;

    busyRef.current = true;
    const operation = ++operationRef.current;
    void resolveSavedOrGenerate(roomRowId, operation);
  }, [
    isHydrated,
    roomRowId,
    roomEntries.length,
    state.status,
    resolveSavedOrGenerate,
  ]);

  // Room data was cleared elsewhere (isSummary dropped): discard the stale summary.
  const isSummary = useRoomStore((s) => s.isSummary);
  useEffect(() => {
    if (!roomRowId || isSummary || state.status !== "ready") return;

    stateByRoomRef.current.delete(roomRowId);
    const operation = ++operationRef.current;
    busyRef.current = false;
    commitState(roomRowId, operation, {
      status: "empty",
      groups: [],
      summaries: [],
      question: "",
      error: null,
    });
  }, [commitState, isSummary, roomRowId, state.status]);

  const retry = useCallback(async () => {
    if (!roomRowId || busyRef.current) return;

    busyRef.current = true;
    const operation = ++operationRef.current;
    await resolveSavedOrGenerate(roomRowId, operation);
  }, [resolveSavedOrGenerate, roomRowId]);

  const regenerate = useCallback(async () => {
    if (
      !roomRowId ||
      busyRef.current ||
      state.status !== "ready" ||
      state.summaries.length === 0
    ) {
      return;
    }

    const currentRoomId = useRoomStore.getState().roomId;
    const currentEntriesState = useEntriesStore.getState().entries;
    const currentEntries = currentRoomId
      ? currentEntriesState.filter((entry) => entry.roomId === currentRoomId)
      : [];
    if (currentEntries.length === 0) {
      const operation = ++operationRef.current;
      commitState(roomRowId, operation, {
        status: "error",
        groups: [],
        summaries: [],
        question: "",
        error: "No submissions are available to regenerate this summary.",
      });
      return;
    }

    busyRef.current = true;
    const operation = ++operationRef.current;
    commitState(roomRowId, operation, {
      ...state,
      status: "generating",
      error: null,
    });

    try {
      const { roundQuestion = "" } = await getRoomSnapshot(roomRowId);
      await saveRoomRound(roomRowId, {
        groups: state.groups,
        summaries: state.summaries,
        question: state.question,
      });
      const result = await generateAndSaveHostSummary(roomRowId, {
        items: currentEntries.map((entry) => ({
          id: entry.$id,
          input: entry.input,
          name: entry.name,
        })),
        question: roundQuestion,
      });
      setIsSummary(true);
      commitState(roomRowId, operation, {
        status: "ready",
        groups: result.groups,
        summaries: result.summaries,
        question: roundQuestion,
        error: null,
      });
    } catch (error) {
      try {
        const snapshot = await getRoomSnapshot(roomRowId);
        if (snapshot.summaries.length > 0) setIsSummary(true);
        commitState(roomRowId, operation, {
          status: snapshot.summaries.length > 0 ? "ready" : "error",
          groups: snapshot.groups,
          summaries: snapshot.summaries,
          question: snapshot.roundQuestion ?? "",
          error: getErrorMessage(error, "Failed to regenerate summary"),
        });
      } catch {
        commitState(roomRowId, operation, {
          status: "error",
          groups: state.groups,
          summaries: state.summaries,
          question: state.question,
          error: getErrorMessage(error, "Failed to regenerate summary"),
        });
      }
    } finally {
      if (operationRef.current === operation) {
        busyRef.current = false;
      }
    }
  }, [commitState, roomRowId, setIsSummary, state]);

  /** Resolves true only when the new round was started. */
  const beginNewRound = useCallback(async (nextQuestion = ""): Promise<boolean> => {
    if (
      !roomId ||
      !roomRowId ||
      busyRef.current ||
      state.status !== "ready" ||
      state.summaries.length === 0
    ) {
      return false;
    }

    busyRef.current = true;
    setIsResetting(true);
    const operation = ++operationRef.current;
    try {
      await saveRoomRound(roomRowId, {
        groups: state.groups,
        summaries: state.summaries,
        question: state.question,
      });
      await startNewRound(roomId, roomRowId, nextQuestion);
      if (
        mountedRef.current &&
        useRoomStore.getState().roomRowId === roomRowId &&
        operationRef.current === operation
      ) {
        setEntriesForRoom(roomId, []);
        setIsSummary(false);
        commitState(roomRowId, operation, {
          status: "empty",
          groups: [],
          summaries: [],
          question: normalizeRoundQuestion(nextQuestion),
          error: null,
        });
      }
      return true;
    } catch (error) {
      commitState(roomRowId, operation, {
        status: "error",
        groups: [],
        summaries: [],
        question: "",
        error: getErrorMessage(error, "Failed to start new round"),
      });
      return false;
    } finally {
      if (operationRef.current === operation) {
        busyRef.current = false;
        if (mountedRef.current) setIsResetting(false);
      }
    }
  }, [commitState, roomId, roomRowId, setEntriesForRoom, setIsSummary, state]);

  const topGroups = useMemo(
    () => getTopGroups(state.groups, TOP_GROUPS_COUNT),
    [state.groups],
  );
  const displaySummaries = useMemo(
    () => getDisplaySummaries(state.groups, state.summaries),
    [state.groups, state.summaries],
  );

  return {
    status: state.status,
    topGroups,
    summaries: displaySummaries,
    error: state.error,
    question: state.question,
    isHydrated,
    isResetting,
    busy:
      state.status === "loading_saved" ||
      state.status === "generating" ||
      isResetting,
    entryCount: roomEntries.length,
    retry,
    regenerate,
    beginNewRound,
    roomId,
    roomRowId,
  };
}
