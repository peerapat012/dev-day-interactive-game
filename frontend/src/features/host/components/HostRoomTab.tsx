"use client";

import { confirmDialog } from "@/shared/feedback/dialogStore";
import { toast } from "@/shared/feedback/toastStore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSwitchRoomMode } from "@/features/host/hooks/useSwitchRoomMode";
import { buildGuestJoinUrl } from "@/lib/guestJoinUrl";
import { modeLabel } from "@/lib/roomMode";
import { leaveHostRoom } from "@/lib/leaveHostRoom";
import { clearRoomRows, closeRoomSession } from "@/services/appwrite/rooms";
import { useEntriesStore } from "@/store/entriesStore";
import { useRoomStore } from "@/store/roomStore";
import { Button } from "@/shared/ui/Button";

interface HostRoomTabProps {
  roomId: string;
  roomRowId: string;
  creating: boolean;
  onCreateNewRoom: () => Promise<string>;
}

export function HostRoomTab({
  roomId,
  roomRowId,
  creating,
  onCreateNewRoom,
}: HostRoomTabProps) {
  const router = useRouter();
  const setEntries = useEntriesStore((s) => s.setEntries);
  const setIsSummary = useRoomStore((s) => s.setIsSummary);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [closing, setClosing] = useState(false);

  const { switching, target, switchMode } = useSwitchRoomMode(
    "wordcloud",
    roomId,
    roomRowId,
  );

  const guestUrl = useMemo(() => buildGuestJoinUrl(roomId), [roomId]);

  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(guestUrl)}`,
    [guestUrl],
  );

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  }

  async function handleCreateNewRoom() {
    const confirmed = await confirmDialog({
      title: "Create a new room?",
      message:
        "A new code will be generated. The current guest link and QR will stop working for this session.",
      confirmLabel: "New room",
    });
    if (!confirmed) return;

    try {
      const newCode = await onCreateNewRoom();
      toast.success(`New room code: ${newCode}`, "New room created");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create room",
      );
    }
  }

  async function handleCloseRoomSession() {
    const confirmed = await confirmDialog({
      title: "End this room?",
      message:
        "Guests will be cleared off this session, their old QR/link will stop working, and you will return to the home page.",
      confirmLabel: "End room",
      tone: "danger",
    });
    if (!confirmed) return;

    setClosing(true);
    try {
      await closeRoomSession(roomRowId);
      leaveHostRoom();
      router.replace("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not close the room",
      );
    } finally {
      setClosing(false);
    }
  }

  async function handleClear() {
    const confirmed = await confirmDialog({
      title: "Clear all phrases?",
      message:
        "All phrases and saved summaries for this room will be removed. Guests keep the same link and can send a new phrase.",
      confirmLabel: "Clear",
      tone: "danger",
    });
    if (!confirmed) return;

    setClearing(true);
    try {
      await clearRoomRows(roomId);
      setEntries([]);
      setIsSummary(false);
      toast.success("All phrases and summaries were cleared.", "Room cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Clear failed");
    } finally {
      setClearing(false);
    }
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col items-center rounded-3xl border border-line bg-surface p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">
          Scan to join
        </p>
        <div className="mt-4 rounded-2xl bg-white p-3 shadow-lg shadow-primary/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt={`QR code for room ${roomId}`}
            width={280}
            height={280}
            className="h-auto w-[min(280px,70vw)]"
          />
        </div>
        <p className="mt-5 text-xs text-fg-muted">Room ID</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-primary-text">
          {roomId}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleCopyCode()}
          className="mt-3"
        >
          {copiedCode ? "Code copied!" : "Copy room ID"}
        </Button>
      </div>

      <motion.div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-fg-secondary">
          Need a fresh room code for a new session? Guests will use the new QR
          and link below.
        </p>
        <Button
          type="button"
          onClick={() => void handleCreateNewRoom()}
          disabled={creating || clearing || closing}
          className="mt-3 w-full"
        >
          {creating ? "Creating…" : "Create new room"}
        </Button>
      </motion.div>

      <motion.div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm text-fg-secondary">
          Run a quiz in this same room. The code and guests stay; their screens
          switch automatically.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void switchMode()}
          disabled={switching || creating || clearing || closing}
          className="mt-3 w-full"
        >
          {switching ? "Switching…" : `Switch to ${modeLabel(target)}`}
        </Button>
      </motion.div>

      <motion.div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
        <p className="text-sm text-fg-secondary">
          End the live session: connected guests are cleared locally, joins to this
          QR stop working, and you return to the home page to host again later.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleCloseRoomSession()}
          disabled={closing || clearing}
          className="mt-3 w-full border-amber-500/35 text-accent-text hover:text-amber-100"
        >
          {closing ? "Closing session…" : "Close room & end session"}
        </Button>
      </motion.div>

      <motion.div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">
          Guest link
        </p>
        <p className="mt-2 break-all text-sm text-fg-secondary">{guestUrl}</p>
        <Button
          type="button"
          onClick={() => void handleCopyLink()}
          className="mt-4 w-full"
        >
          {copiedLink ? "Link copied!" : "Copy guest link"}
        </Button>
      </motion.div>

      <motion.div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
        <p className="text-sm text-fg-muted">
          Removes all phrases, groups, summaries, and saved rounds for this room. Guest
          nicknames stay; everyone can submit a new phrase again with the same link.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleClear()}
          disabled={clearing || closing}
          className="mt-3 w-full border-rose-500/30 text-danger"
        >
          {clearing ? "Clearing…" : "Clear room data"}
        </Button>
      </motion.div>
    </motion.div>
  );
}
