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
      <header className="shrink-0 border-b border-line bg-background/90 py-3 pl-4 pr-16 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold uppercase text-primary-text"
            aria-hidden
          >
            {displayName.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-fg">
              {displayName}
            </h1>
            <p className="text-xs text-fg-muted">Guest lobby · Word Cloud Game</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleLeaveRoom}
            className="min-h-11 shrink-0 px-4 py-1.5 text-xs text-fg-muted hover:text-danger"
          >
            Leave room
          </Button>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <RoundQuestionCard question={question} />
        <GuestEntriesFeed />
      </main>

      <footer className="shrink-0 border-t border-line bg-background/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto w-full max-w-lg">
          {guestInvalid ? (
            <motion.div
              className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="flex-1 px-1 text-sm text-fg-secondary">
                <span className="font-semibold text-accent-text">
                  Room restarted by host.
                </span>{" "}
                Rejoin using the host&apos;s QR code to send a new phrase.
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={handleLeaveRoom}
                className="shrink-0 border-amber-500/40 text-accent-text"
              >
                Clear this device &amp; rejoin
              </Button>
            </motion.div>
          ) : checking ? (
            <p className="py-3 text-center text-sm text-fg-muted">
              Checking submission…
            </p>
          ) : hasSubmitted ? (
            <motion.div
              className="flex items-start gap-3 rounded-2xl bg-success-soft px-4 py-3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 size-5 shrink-0 text-success"
                aria-hidden
              >
                <path d="M4.5 10.5l3.5 3.5 7.5-8" />
              </svg>
              <p className="text-sm text-fg-secondary">
                <span className="font-semibold text-success">
                  You already sent your phrase.
                </span>{" "}
                Each guest can only submit once. You can still read everyone
                else&apos;s phrases above.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={question.trim() ? "Type your short answer…" : "Type your one phrase for this game…"}
                  disabled={isSubmitting}
                  maxLength={200}
                  autoComplete="off"
                  aria-label="Your phrase"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !text.trim()}
                  className="shrink-0"
                >
                  {isSubmitting ? "Sending…" : "Send"}
                </Button>
              </div>
              {error ? (
                <p className="text-center text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : (
                <p className="text-center text-xs text-fg-muted">
                  One phrase per guest — choose carefully.
                </p>
              )}
            </form>
          )}
        </div>
      </footer>
    </motion.div>
  );
}
