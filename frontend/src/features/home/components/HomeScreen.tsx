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

export function HomeScreen() {
  const [mode, setMode] = useState<RoomMode>("wordcloud");
  const isQuiz = mode === "quiz";

  return (
    <motion.div
      className="flex min-h-dvh flex-col items-center justify-center px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute -left-32 top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <motion.div
          className="absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 w-full max-w-lg"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
      >
        <div className="mb-8 text-center">
          <motion.p
            className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Word Cloud Game
          </motion.p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Choose your mode
          </h1>
          <p className="mx-auto mt-3 max-w-md text-zinc-400">
            Pick a game mode, then host a session with a room code and QR, or
            join as a guest with the link from the presenter.
          </p>
        </div>

        <div className="mb-6 inline-flex w-full max-w-xs rounded-full border border-white/10 bg-white/5 p-1">
          {MODES.map((item) => {
            const active = mode === item.mode;
            return (
              <button
                key={item.mode}
                type="button"
                onClick={() => setMode(item.mode)}
                className={`relative flex-1 rounded-full py-2.5 text-sm font-medium transition-transform active:scale-[0.96] ${
                  active ? "text-white" : "text-zinc-400"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-full bg-violet-500 shadow-lg shadow-violet-500/25"
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  />
                ) : null}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <RoleCard
            href={isQuiz ? QUIZ_HOST_PATH : HOST_PATH}
            title={isQuiz ? "Host a Quiz" : "Host"}
            description={
              isQuiz
                ? "Build a question deck, run live rounds with a timer, and crown the winner."
                : "Create a room, share the QR, collect inputs, and view summaries."
            }
            accent="from-violet-600/30 to-violet-950/50 border-violet-400/30"
            delay={0.15}
          />
          <RoleCard
            href={GUEST_PATH}
            title="Guest"
            description="Enter the host’s room code and your nickname to join and play."
            accent="from-cyan-600/25 to-zinc-950/50 border-cyan-400/25"
            delay={0.22}
          />
        </div>

        <AnimatePresence initial={false}>
          {isQuiz ? (
            <motion.p
              className="mt-6 text-center text-xs leading-relaxed text-zinc-500"
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
    </motion.div>
  );
}

function RoleCard({
  href,
  title,
  description,
  accent,
  delay,
}: {
  href: string;
  title: string;
  description: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        href={href}
        className={`group flex h-full flex-col gap-3 rounded-3xl border bg-gradient-to-br p-6 shadow-xl transition-[transform,border-color] duration-200 ease-out hover:scale-[1.02] hover:border-white/20 ${accent}`}
      >
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="flex-1 text-sm leading-relaxed text-zinc-300">{description}</p>
        <span className="text-sm font-medium text-violet-200 group-hover:text-white">
          Open {title.toLowerCase()} →
        </span>
      </Link>
    </motion.div>
  );
}
