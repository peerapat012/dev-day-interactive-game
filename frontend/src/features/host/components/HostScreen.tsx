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
  creating,
  createNewRoom,
}: {
  activeTab: HostTabId;
  roomId: string;
  creating: boolean;
  createNewRoom: () => Promise<string>;
}) {
  if (activeTab === "room")
    return (
      <HostRoomTab
        roomId={roomId}
        creating={creating}
        onCreateNewRoom={createNewRoom}
      />
    );
  if (activeTab === "inputs") return <HostInputsTab roomId={roomId} />;
  if (activeTab === "groups") return <HostGroupsTab />;
  return <HostSummaryTab />;
}

export function HostScreen() {
  const setGuestMode = usePlayerStore((s) => s.setGuestMode);
  const { ready, error, roomId, creating, createNewRoom } = useHostRoom();
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

  if (error || !roomId) {
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
        creating={creating}
        createNewRoom={createNewRoom}
      />
    </HostShell>
  );
}
