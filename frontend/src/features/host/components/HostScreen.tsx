"use client";

import { useEffect, useMemo, useState } from "react";
import { useRoundQuestion } from "@/features/cloud/hooks/useRoundQuestion";
import { HostInputsTab } from "@/features/host/components/HostInputsTab";
import { HostRoomTab } from "@/features/host/components/HostRoomTab";
import { HostShell } from "@/features/host/components/HostShell";
import { HostSummaryTab } from "@/features/host/components/HostSummaryTab";
import { useHostRoom } from "@/features/host/hooks/useHostRoom";
import type { HostTabId } from "@/features/host/components/HostTabBar";
import {
  isSummaryTabEnabled,
  resolveHostLandingTab,
} from "@/lib/hostSummaryState";
import { confirmDialog } from "@/shared/feedback/dialogStore";
import { useEntriesStore } from "@/store/entriesStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

const TAB_COPY: Record<HostTabId, { title: string; description: string }> = {
  room: {
    title: "Room",
    description:
      "Share the QR code or room ID so guests can join this session.",
  },
  inputs: {
    title: "Guest inputs",
    description: "Live list of phrases guests submit — read only.",
  },
  summary: {
    title: "Summary",
    description: "Generate AI summaries from guest submissions.",
  },
};

function HostTabPanel({
  activeTab,
  roomId,
  roomRowId,
  creating,
  createNewRoom,
}: {
  activeTab: HostTabId;
  roomId: string;
  roomRowId: string;
  creating: boolean;
  createNewRoom: () => Promise<string>;
}) {
  // One source for both tabs so an edit on either shows on the other at once.
  const { question, setQuestion } = useRoundQuestion(roomId);

  return (
    <>
      <div className={activeTab === "room" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <HostRoomTab
          roomId={roomId}
          roomRowId={roomRowId}
          creating={creating}
          onCreateNewRoom={createNewRoom}
          question={question}
          onQuestionSaved={setQuestion}
        />
      </div>
      <div className={activeTab === "inputs" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <HostInputsTab
          roomId={roomId}
          roomRowId={roomRowId}
          question={question}
          onQuestionSaved={setQuestion}
        />
      </div>
      <div className={activeTab === "summary" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <HostSummaryTab isActive={activeTab === "summary"} />
      </div>
    </>
  );
}

export function HostScreen({
  initialTab = "room",
}: {
  initialTab?: HostTabId;
}) {
  const setGuestMode = usePlayerStore((s) => s.setGuestMode);
  const { ready, error, roomId, roomRowId, creating, createNewRoom } = useHostRoom();
  const isSummary = useRoomStore((s) => s.isSummary);
  const entries = useEntriesStore((s) => s.entries);
  const isHydrated = useEntriesStore((s) => s.isHydrated);
  const [preferredTab, setPreferredTab] = useState<HostTabId>(initialTab);

  const entryCount = useMemo(
    () => (roomId ? entries.filter((entry) => entry.roomId === roomId).length : 0),
    [entries, roomId],
  );
  const summaryEnabled = isSummaryTabEnabled(isSummary, entryCount);
  const activeTab = resolveHostLandingTab(preferredTab, isSummary, entryCount);
  const copy = TAB_COPY[activeTab];

  // Commit the Room fallback so the first guest input of a new round does not
  // jump back to Summary and generate from a one-entry snapshot (ADR 0011).
  if (isHydrated && preferredTab !== activeTab) setPreferredTab(activeTab);

  useEffect(() => {
    setGuestMode(false);
  }, [setGuestMode]);

  const handleTabChange = async (tab: HostTabId) => {
    // Opening Summary without a saved summary starts AI generation (ADR 0011),
    // so let the host wait for more guest inputs first.
    if (tab === "summary" && activeTab !== "summary" && !isSummary) {
      const confirmed = await confirmDialog({
        title: "Generate summary now?",
        message: `AI will summarize the ${entryCount} input${entryCount === 1 ? "" : "s"} received so far. Inputs sent later need a manual refresh.`,
        confirmLabel: "Generate summary",
      });
      if (!confirmed) return;
    }
    setPreferredTab(tab);
  };

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
        Preparing host room…
      </div>
    );
  }

  if (error || !roomId || !roomRowId) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center text-sm text-danger">
        {error ?? "Could not open host room."}
      </div>
    );
  }

  return (
    <HostShell
      activeTab={activeTab}
      onTabChange={(tab) => void handleTabChange(tab)}
      title={copy.title}
      description={copy.description}
      summaryEnabled={summaryEnabled}
    >
      <HostTabPanel
        activeTab={activeTab}
        roomId={roomId}
        roomRowId={roomRowId}
        creating={creating}
        createNewRoom={createNewRoom}
      />
    </HostShell>
  );
}
