"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ensureGuestSession, getAccount } from "@/services/appwrite/auth";
import { usePlayerStore } from "@/store/playerStore";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

const MIN_NAME = 2;
const MAX_NAME = 20;

export function LobbyScreen() {
  const router = useRouter();
  const storedName = usePlayerStore((s) => s.displayName);
  const setDisplayName = usePlayerStore((s) => s.setDisplayName);
  const [name, setName] = useState(storedName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trimmed = name.trim();
  const isValid =
    trimmed.length >= MIN_NAME && trimmed.length <= MAX_NAME;

  async function handleJoin() {
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      await ensureGuestSession();
      try {
        await getAccount().updateName({ name: trimmed });
      } catch {
        /* name still saved locally for entries */
      }
      setDisplayName(trimmed);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="flex min-h-dvh flex-col items-center justify-center px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <motion.div
          className="absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
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
            Join the lobby
          </h1>
          <p className="mt-3 text-zinc-400">
            Pick a nickname — it shows on the cloud when you submit phrases.
          </p>
        </div>

        <motion.div
          className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:p-8"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <label
            htmlFor="player-name"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Your nickname
          </label>
          <Input
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleJoin();
            }}
            placeholder="e.g. Alex"
            maxLength={MAX_NAME}
            autoComplete="nickname"
            autoFocus
            className="mb-1 text-center text-lg font-semibold"
          />
          <p className="mb-6 text-center text-xs text-zinc-500">
            {MIN_NAME}–{MAX_NAME} characters
          </p>

          {error ? (
            <p className="mb-4 text-center text-sm text-rose-400">{error}</p>
          ) : null}

          <Button
            type="button"
            disabled={!isValid || loading}
            onClick={() => void handleJoin()}
            className="w-full py-4 text-base font-semibold"
          >
            {loading ? "Joining…" : "Enter game →"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
