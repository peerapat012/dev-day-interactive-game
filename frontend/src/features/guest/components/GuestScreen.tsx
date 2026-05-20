"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GuestMessagePanel } from "@/features/guest/components/GuestMessagePanel";
import { GuestNameForm } from "@/features/guest/components/GuestNameForm";
import { normalizeRoomCode } from "@/lib/roomCode";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

export function GuestScreen() {
  const searchParams = useSearchParams();
  const guestMode = usePlayerStore((s) => s.guestMode);
  const displayName = usePlayerStore((s) => s.displayName);
  const storedRoomId = useRoomStore((s) => s.roomId);
  const guestId = useRoomStore((s) => s.guestId);
  const [ready, setReady] = useState(false);
  const [joined, setJoined] = useState(false);

  const roomFromUrl = useMemo(
    () => normalizeRoomCode(searchParams.get("room") ?? ""),
    [searchParams],
  );

  const roomCode = roomFromUrl || storedRoomId;

  useEffect(() => {
    const unsub = usePlayerStore.persist.onFinishHydration(() => {
      setReady(true);
    });
    if (usePlayerStore.persist.hasHydrated()) {
      setReady(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (guestMode && displayName.trim() && guestId && storedRoomId) {
      setJoined(true);
    }
  }, [ready, guestMode, displayName, guestId, storedRoomId]);

  if (!ready) {
    return (
      <motion.div
        className="flex min-h-dvh items-center justify-center text-sm text-zinc-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Loading…
      </motion.div>
    );
  }

  if (!roomCode && !joined) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-medium text-zinc-200">Missing room code</p>
        <p className="mt-2 text-sm text-zinc-500">
          Scan the host QR code or open the guest link shared by the host.
        </p>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="relative flex min-h-dvh flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-32 top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <div className="absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl" />
        </div>

        <div className="relative z-10 px-4 pb-[env(safe-area-inset-bottom)] pt-[max(2rem,env(safe-area-inset-top))] text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
            Word Cloud Game
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join as guest
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-zinc-400">
            Enter your nickname to join this room.
          </p>
        </div>

        <GuestNameForm roomCode={roomCode} onJoined={() => setJoined(true)} />
      </div>
    );
  }

  return <GuestMessagePanel />;
}
