"use client";

import { useEffect, useMemo, useState } from "react";
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
  return (
    <>
      <div className={activeTab === "room" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <HostRoomTab
          roomId={roomId}
          roomRowId={roomRowId}
          creating={creating}
          onCreateNewRoom={createNewRoom}
        />
      </div>
      <div className={activeTab === "inputs" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <HostInputsTab roomId={roomId} />
      </div>
      <div className={activeTab === "summary" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <HostSummaryTab />
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
  const [preferredTab, setPreferredTab] = useState<HostTabId>(initialTab);

  const entryCount = useMemo(
    () => (roomId ? entries.filter((entry) => entry.roomId === roomId).length : 0),
    [entries, roomId],
  );
  const summaryEnabled = isSummaryTabEnabled(isSummary, entryCount);
  const activeTab = resolveHostLandingTab(preferredTab, isSummary, entryCount);
  const copy = TAB_COPY[activeTab];

  useEffect(() => {
    setGuestMode(false);
  }, [setGuestMode]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Preparing host room…
      </div>
    );
  }

  if (error || !roomId || !roomRowId) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center text-sm text-rose-400">
        {error ?? "Could not open host room."}
      </div>
    );
  }

  return (
    <HostShell
      activeTab={activeTab}
      onTabChange={setPreferredTab}
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
