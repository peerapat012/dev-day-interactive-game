"use client";

import { useEffect, useState } from "react";
import { HostGroupsTab } from "@/features/host/components/HostGroupsTab";
import { HostInputsTab } from "@/features/host/components/HostInputsTab";
import { HostRoomTab } from "@/features/host/components/HostRoomTab";
import { HostShell } from "@/features/host/components/HostShell";
import { HostSummaryTab } from "@/features/host/components/HostSummaryTab";
import { useHostRoom } from "@/features/host/hooks/useHostRoom";
import type { HostTabId } from "@/features/host/components/HostTabBar";
import { usePlayerStore } from "@/store/playerStore";

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
  groups: {
    title: "Groups",
    description:
      "Classify guest submissions into semantic groups. Bubble size reflects how many phrases are in each group.",
  },
  summary: {
    title: "Summary",
    description:
      "Classify submissions and generate AI summaries for the top groups.",
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
      <div className={activeTab === "groups" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <HostGroupsTab />
      </div>
      <div className={activeTab === "summary" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <HostSummaryTab />
      </div>
    </>
  );
}

export function HostScreen() {
  const setGuestMode = usePlayerStore((s) => s.setGuestMode);
  const { ready, error, roomId, roomRowId, creating, createNewRoom } = useHostRoom();
  const [activeTab, setActiveTab] = useState<HostTabId>("room");
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
      onTabChange={setActiveTab}
      title={copy.title}
      description={copy.description}
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
