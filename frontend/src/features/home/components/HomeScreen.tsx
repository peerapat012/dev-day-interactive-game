"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GUEST_PATH } from "@/lib/guestPaths";
import { HOST_PATH } from "@/lib/hostPaths";

export function HomeScreen() {
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
        <div className="mb-10 text-center">
          <motion.p
            className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Word Cloud Game
          </motion.p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Choose your role
          </h1>
          <p className="mx-auto mt-3 max-w-md text-zinc-400">
            Host a session with a room code and QR, or join as a guest with the
            link from the presenter.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <RoleCard
            href={HOST_PATH}
            title="Host"
            description="Create a room, share the QR, classify groups, and run summaries."
            accent="from-violet-600/30 to-violet-950/50 border-violet-400/30"
            delay={0.15}
          />
          <RoleCard
            href={GUEST_PATH}
            title="Guest"
            description="Enter the host’s room code and your nickname to join and send one phrase."
            accent="from-cyan-600/25 to-zinc-950/50 border-cyan-400/25"
            delay={0.22}
          />
        </div>
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
        className={`group flex h-full flex-col gap-3 rounded-3xl border bg-gradient-to-br p-6 shadow-xl transition hover:scale-[1.02] hover:border-white/20 ${accent}`}
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
