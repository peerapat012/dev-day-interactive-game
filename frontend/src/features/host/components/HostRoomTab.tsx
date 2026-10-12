"use client";

import { confirmDialog } from "@/shared/feedback/dialogStore";
import { toast } from "@/shared/feedback/toastStore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { RoundQuestionEditor } from "@/features/host/components/RoundQuestionEditor";
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
  question: string;
  onQuestionSaved: (question: string) => void;
}

export function HostRoomTab({
  roomId,
  roomRowId,
  creating,
  onCreateNewRoom,
  question,
  onQuestionSaved,
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

  const busy = creating || clearing || closing;

  return (
    <motion.div
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <section
        aria-label="Join this room"
        className="flex flex-col items-center rounded-3xl border border-line bg-surface px-5 py-8 sm:px-8 lg:sticky lg:top-6"
      >
        <div className="rounded-2xl bg-white p-3 shadow-[0_12px_32px_-12px_rgb(0_80_252/0.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt={`QR code for room ${roomId}`}
            width={280}
            height={280}
            className="block h-auto w-[min(280px,68vw)] lg:w-[min(340px,30vw)]"
          />
        </div>

        <p className="mt-6 text-sm text-fg-muted">Scan or enter room code</p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-[0.2em] text-primary-text tabular-nums sm:text-5xl">
          {roomId}
        </p>

        <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleCopyCode()}
          >
            {copiedCode ? "Code copied!" : "Copy room ID"}
          </Button>
          <Button type="button" onClick={() => void handleCopyLink()}>
            {copiedLink ? "Link copied!" : "Copy guest link"}
          </Button>
        </div>
        <p className="mt-3 w-full max-w-sm break-all text-center text-xs text-fg-muted">
          {guestUrl}
        </p>
      </section>

      <div className="flex flex-col gap-6">
        <RoundQuestionEditor
          roomRowId={roomRowId}
          question={question}
          onSaved={onQuestionSaved}
        />

        <ActionGroup title="Session">
          <ActionRow
            description="Run a quiz in this same room. The code and guests stay; their screens switch automatically."
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => void switchMode()}
              disabled={switching || busy}
              className="w-full sm:w-auto"
            >
              {switching ? "Switching…" : `Switch to ${modeLabel(target)}`}
            </Button>
          </ActionRow>
          <ActionRow description="Need a fresh room code for a new session? Guests will use the new QR and link.">
            <Button
              type="button"
              variant="ghost"
              onClick={() => void handleCreateNewRoom()}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              {creating ? "Creating…" : "Create new room"}
            </Button>
          </ActionRow>
        </ActionGroup>

        <ActionGroup title="Danger zone" tone="danger">
          <ActionRow description="Removes all phrases, groups, summaries, and saved rounds for this room. Guest nicknames stay; everyone can submit a new phrase again with the same link.">
            <Button
              type="button"
              variant="ghost"
              onClick={() => void handleClear()}
              disabled={clearing || closing}
              className="w-full border-danger/30 text-danger sm:w-auto"
            >
              {clearing ? "Clearing…" : "Clear room data"}
            </Button>
          </ActionRow>
          <ActionRow description="End the live session: connected guests are cleared locally, joins to this QR stop working, and you return to the home page to host again later.">
            <Button
              type="button"
              variant="danger"
              onClick={() => void handleCloseRoomSession()}
              disabled={closing || clearing}
              className="w-full sm:w-auto"
            >
              {closing ? "Closing session…" : "Close room & end session"}
            </Button>
          </ActionRow>
        </ActionGroup>
      </div>
    </motion.div>
  );
}

function ActionGroup({
  title,
  tone = "default",
  children,
}: {
  title: string;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  const danger = tone === "danger";
  return (
    <section className="flex flex-col gap-2">
      <h2
        className={`px-1 text-sm font-semibold ${danger ? "text-danger" : "text-fg-secondary"}`}
      >
        {title}
      </h2>
      <div
        className={`flex flex-col divide-y rounded-2xl border ${
          danger
            ? "divide-danger/15 border-danger/25 bg-danger-soft"
            : "divide-line border-line bg-surface"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

function ActionRow({
  description,
  children,
}: {
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
      <p className="flex-1 text-pretty text-sm leading-relaxed text-fg-secondary">
        {description}
      </p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
