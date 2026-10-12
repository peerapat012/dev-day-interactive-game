"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { GUEST_PATH } from "@/lib/guestPaths";
import { HOST_PATH, QUIZ_HOST_PATH } from "@/lib/hostPaths";
import type { RoomMode } from "@/types/quiz";

const MODES: { mode: RoomMode; label: string }[] = [
  { mode: "wordcloud", label: "Word Cloud" },
  { mode: "quiz", label: "Quiz" },
];

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function HomeScreen() {
  const [mode, setMode] = useState<RoomMode>("wordcloud");
  const isQuiz = mode === "quiz";

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,env(safe-area-inset-top))]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[min(48rem,140vw)] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary-soft blur-3xl"
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      >
        <header className="text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            Word Cloud Game
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-pretty text-fg-muted">
            Pick a game mode, then host a session with a room code and QR, or
            join as a guest with the link from the presenter.
          </p>
        </header>

        <div
          role="group"
          aria-label="Game mode"
          className="mt-10 flex rounded-full border border-line bg-surface p-1"
        >
          {MODES.map((item) => {
            const active = mode === item.mode;
            return (
              <button
                key={item.mode}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(item.mode)}
                className={`relative min-h-11 flex-1 rounded-full text-sm font-medium transition-[transform,color] active:scale-[0.96] ${
                  active ? "text-primary-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-full bg-primary shadow-md shadow-primary/20"
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  />
                ) : null}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>

        <nav aria-label="Choose a role" className="mt-4 flex flex-col gap-3">
          <Link
            href={GUEST_PATH}
            className="group flex items-center gap-4 rounded-3xl bg-primary px-6 py-5 text-primary-fg shadow-lg shadow-primary/25 transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span className="flex flex-1 flex-col gap-1">
              <span className="text-xl font-semibold">Join a room</span>
              <span className="text-sm leading-relaxed text-primary-fg/80">
                Enter the host’s room code and your nickname to join and play.
              </span>
            </span>
            <Arrow />
          </Link>

          <Link
            href={isQuiz ? QUIZ_HOST_PATH : HOST_PATH}
            className="group flex items-center gap-4 rounded-3xl border border-line bg-surface px-6 py-5 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong active:scale-[0.98]"
          >
            <span className="flex flex-1 flex-col gap-1">
              <span className="text-lg font-semibold text-fg">
                {isQuiz ? "Host a Quiz" : "Host a Word Cloud"}
              </span>
              <span className="text-sm leading-relaxed text-fg-muted">
                {isQuiz
                  ? "Build a question deck, run live rounds with a timer, and crown the winner."
                  : "Create a room, share the QR, collect inputs, and view summaries."}
              </span>
            </span>
            <Arrow className="text-primary-text" />
          </Link>
        </nav>

        <AnimatePresence initial={false}>
          {isQuiz ? (
            <motion.p
              className="mt-5 text-center text-xs leading-relaxed text-fg-muted"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              Guests join with the same room code and QR — no separate app.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-5 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1 ${className}`}
      aria-hidden
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}
