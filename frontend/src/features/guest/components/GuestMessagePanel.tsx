"use client";

import { confirmDialog } from "@/shared/feedback/dialogStore";
import { motion } from "framer-motion";
import { useState } from "react";
import { GuestEntriesFeed } from "@/features/guest/components/GuestEntriesFeed";
import { useGuestSubmissionStatus } from "@/features/guest/hooks/useGuestSubmissionStatus";
import { useRoundQuestion } from "@/features/cloud/hooks/useRoundQuestion";
import { useSubmitEntry } from "@/features/cloud/hooks/useSubmitEntry";
import { useEntriesStore } from "@/store/entriesStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";
import { RoundQuestionCard } from "@/shared/ui/RoundQuestionCard";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { leaveGuestRoom } from "@/lib/leaveGuestRoom";

interface GuestMessagePanelProps {
  onLeaveRoom?: () => void;
}

export function GuestMessagePanel({ onLeaveRoom }: GuestMessagePanelProps) {
  const displayName = usePlayerStore((s) => s.displayName);
  const roomId = useRoomStore((s) => s.roomId);
  const { question } = useRoundQuestion(roomId);
  const [text, setText] = useState("");
  const { submit, isSubmitting, hasSubmitted } = useSubmitEntry();
  const { checking, guestInvalid } = useGuestSubmissionStatus();
  const error = useEntriesStore((s) => s.error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || isSubmitting || hasSubmitted) return;

    await submit(value);
    if (!useEntriesStore.getState().error) {
      setText("");
    }
  }

  async function handleLeaveRoom() {
    const confirmed = await confirmDialog({
      title: "Leave this room?",
      message:
        "Your nickname and saved room on this device will be cleared. You can scan the QR again to rejoin.",
      confirmLabel: "Leave",
      tone: "danger",
    });
    if (!confirmed) return;
    void leaveGuestRoom().then(() => onLeaveRoom?.());
  }

  return (
    <motion.div
      className="flex min-h-dvh flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="shrink-0 border-b border-line bg-background/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-text sm:text-xs">
          Word Cloud Game
        </p>
        <h1 className="mt-1 text-xl font-semibold text-fg sm:text-2xl">
          Guest lobby
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/30 text-xs font-bold uppercase text-primary-text"
              aria-hidden
            >
              {displayName.slice(0, 1)}
            </span>
            <span className="max-w-[200px] truncate text-sm font-medium text-fg-secondary">
              {displayName}
            </span>
          </div>
          {hasSubmitted ? (
            <span className="text-xs text-success">Phrase sent</span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={handleLeaveRoom}
            className="ml-auto shrink-0 px-3 py-1.5 text-xs text-fg-muted hover:text-danger"
          >
            Leave room
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <RoundQuestionCard question={question} className="mb-3" />
        <GuestEntriesFeed />
      </main>

      <footer className="shrink-0 border-t border-line bg-background/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
        {guestInvalid ? (
          <motion.div
            className="mx-auto max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-5 text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-base font-medium text-accent-text">
              Room restarted by host
            </p>
            <p className="mt-2 text-sm text-amber-100/80">
              Rejoin using the host&apos;s QR code to send a new phrase.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLeaveRoom}
              className="mt-4 w-full border-amber-500/40 text-accent-text"
            >
              Clear this device &amp; rejoin
            </Button>
          </motion.div>
        ) : checking ? (
          <p className="text-center text-sm text-fg-muted">Checking submission…</p>
        ) : hasSubmitted ? (
          <motion.div
            className="mx-auto max-w-lg rounded-2xl border border-emerald-500/25 bg-success-soft px-4 py-5 text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-base font-medium text-success">
              You already sent your phrase
            </p>
            <p className="mt-2 text-sm text-fg-muted">
              Each guest can only submit once. You can still read everyone else&apos;s
              phrases above.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLeaveRoom}
              className="mt-4 w-full text-fg-muted hover:text-danger"
            >
              Leave room
            </Button>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-lg flex-col gap-3"
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={question.trim() ? "Type your short answer…" : "Type your one phrase for this game…"}
              disabled={isSubmitting}
              maxLength={200}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full"
            >
              {isSubmitting ? "Sending…" : "Send phrase (once)"}
            </Button>
            <p className="text-center text-xs text-fg-muted">
              One phrase per guest — choose carefully.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLeaveRoom}
              className="w-full text-xs text-fg-muted hover:text-danger"
            >
              Leave room
            </Button>
            {error ? (
              <p className="text-center text-sm text-danger">{error}</p>
            ) : null}
          </form>
        )}
      </footer>
    </motion.div>
  );
}
