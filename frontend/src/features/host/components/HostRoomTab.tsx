"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { buildGuestJoinUrl } from "@/lib/guestJoinUrl";
import { clearRoomRows } from "@/services/appwrite/rooms";
import { useEntriesStore } from "@/store/entriesStore";
import { Button } from "@/shared/ui/Button";

interface HostRoomTabProps {
  roomId: string;
}

export function HostRoomTab({ roomId }: HostRoomTabProps) {
  const setEntries = useEntriesStore((s) => s.setEntries);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

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

  async function handleClear() {
    if (
      !window.confirm(
        "Clear all guest names, phrases, groups, and summaries for this room?",
      )
    ) {
      return;
    }

    setClearing(true);
    setClearError(null);
    try {
      await clearRoomRows(roomId);
      setEntries([]);
    } catch (err) {
      setClearError(err instanceof Error ? err.message : "Clear failed");
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
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-zinc-900/70 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Scan to join
        </p>
        <div className="mt-4 rounded-2xl bg-white p-3 shadow-lg shadow-violet-950/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt={`QR code for room ${roomId}`}
            width={280}
            height={280}
            className="h-auto w-[min(280px,70vw)]"
          />
        </div>
        <p className="mt-5 text-xs text-zinc-500">Room ID</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-violet-300">
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

      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Guest link
        </p>
        <p className="mt-2 break-all text-sm text-zinc-300">{guestUrl}</p>
        <Button
          type="button"
          onClick={() => void handleCopyLink()}
          className="mt-4 w-full"
        >
          {copiedLink ? "Link copied!" : "Copy guest link"}
        </Button>
      </div>

      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
        <p className="text-sm text-zinc-400">
          Reset this room: remove all guests, phrases, groups, and summaries from
          the database.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleClear()}
          disabled={clearing}
          className="mt-3 w-full border-rose-500/30 text-rose-300"
        >
          {clearing ? "Clearing…" : "Clear room data"}
        </Button>
        {clearError ? (
          <p className="mt-3 text-sm text-rose-400">{clearError}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
