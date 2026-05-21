"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { GuestEntriesFeed } from "@/features/guest/components/GuestEntriesFeed";
import { useGuestSubmissionStatus } from "@/features/guest/hooks/useGuestSubmissionStatus";
import { useSubmitEntry } from "@/features/cloud/hooks/useSubmitEntry";
import { useEntriesStore } from "@/store/entriesStore";
import { usePlayerStore } from "@/store/playerStore";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { leaveGuestRoom } from "@/lib/leaveGuestRoom";

interface GuestMessagePanelProps {
  onLeaveRoom?: () => void;
}

export function GuestMessagePanel({ onLeaveRoom }: GuestMessagePanelProps) {
  const displayName = usePlayerStore((s) => s.displayName);
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

  function handleLeaveRoom() {
    if (
      !window.confirm(
        "Leave this room? Your nickname and saved room on this device will be cleared. You can scan the QR again to rejoin.",
      )
    ) {
      return;
    }
    void leaveGuestRoom().then(() => onLeaveRoom?.());
  }

  return (
    <motion.div
      className="flex min-h-dvh flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="shrink-0 border-b border-white/10 bg-zinc-950/90 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400 sm:text-xs">
          Word Cloud Game
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-50 sm:text-2xl">
          Guest lobby
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/30 text-xs font-bold uppercase text-violet-200"
              aria-hidden
            >
              {displayName.slice(0, 1)}
            </span>
            <span className="max-w-[200px] truncate text-sm font-medium text-zinc-200">
              {displayName}
            </span>
          </div>
          {hasSubmitted ? (
            <span className="text-xs text-emerald-400/90">Phrase sent</span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={handleLeaveRoom}
            className="ml-auto shrink-0 px-3 py-1.5 text-xs text-zinc-400 hover:text-rose-300"
          >
            Leave room
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <GuestEntriesFeed />
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-zinc-950/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
        {guestInvalid ? (
          <motion.div
            className="mx-auto max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-5 text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-base font-medium text-amber-200">
              Room restarted by host
            </p>
            <p className="mt-2 text-sm text-amber-100/80">
              Rejoin using the host&apos;s QR code to send a new phrase.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLeaveRoom}
              className="mt-4 w-full border-amber-500/40 text-amber-200"
            >
              Clear this device &amp; rejoin
            </Button>
          </motion.div>
        ) : checking ? (
          <p className="text-center text-sm text-zinc-500">Checking submission…</p>
        ) : hasSubmitted ? (
          <motion.div
            className="mx-auto max-w-lg rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-5 text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-base font-medium text-emerald-200">
              You already sent your phrase
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Each guest can only submit once. You can still read everyone else&apos;s
              phrases above.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLeaveRoom}
              className="mt-4 w-full text-zinc-400 hover:text-rose-300"
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
              placeholder="Type your one phrase for this game…"
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
            <p className="text-center text-xs text-zinc-500">
              One phrase per guest — choose carefully.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLeaveRoom}
              className="w-full text-xs text-zinc-500 hover:text-rose-300"
            >
              Leave room
            </Button>
            {error ? (
              <p className="text-center text-sm text-rose-400">{error}</p>
            ) : null}
          </form>
        )}
      </footer>
    </motion.div>
  );
}
