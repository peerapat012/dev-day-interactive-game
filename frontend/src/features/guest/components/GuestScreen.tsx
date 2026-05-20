"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GuestJoinForm } from "@/features/guest/components/GuestJoinForm";
import { GuestMessagePanel } from "@/features/guest/components/GuestMessagePanel";
import { roomCodeFromSearchParams } from "@/lib/guestJoinUrl";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

export function GuestScreen() {
  const searchParams = useSearchParams();
  const guestMode = usePlayerStore((s) => s.guestMode);
  const displayName = usePlayerStore((s) => s.displayName);
  const storedRoomId = useRoomStore((s) => s.roomId);
  const guestId = useRoomStore((s) => s.guestId);
  const setGuestId = useRoomStore((s) => s.setGuestId);
  const setHasSubmitted = useRoomStore((s) => s.setHasSubmitted);
  const [ready, setReady] = useState(false);
  const [joined, setJoined] = useState(false);

  const roomFromQr = useMemo(
    () => roomCodeFromSearchParams(searchParams),
    [searchParams],
  );

  const resumeSameRoom =
    Boolean(storedRoomId) &&
    (!roomFromQr || roomFromQr === storedRoomId);

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

    if (roomFromQr && storedRoomId && roomFromQr !== storedRoomId) {
      setJoined(false);
      setGuestId("");
      setHasSubmitted(false);
      return;
    }

    if (guestMode && displayName.trim() && guestId && storedRoomId && resumeSameRoom) {
      setJoined(true);
    }
  }, [
    ready,
    guestMode,
    displayName,
    guestId,
    storedRoomId,
    roomFromQr,
    resumeSameRoom,
    setGuestId,
    setHasSubmitted,
  ]);

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

  if (!joined) {
    return (
      <div className="relative flex min-h-dvh flex-col overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute -left-32 top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <div className="absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl" />
        </motion.div>

        <motion.div
          className="relative z-10 px-4 pb-[env(safe-area-inset-bottom)] pt-[max(2rem,env(safe-area-inset-top))] text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
            Word Cloud Game
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join as guest
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-zinc-400">
            {roomFromQr ? (
              <>
                Room{" "}
                <span className="font-mono font-semibold text-violet-300">
                  {roomFromQr}
                </span>{" "}
                from QR — confirm the code and enter your nickname.
              </>
            ) : (
              "Enter the room code from the host (or scan their QR) and your nickname."
            )}
          </p>
        </motion.div>

        <GuestJoinForm
          key={roomFromQr || "manual"}
          initialRoomCode={roomFromQr}
          fromQr={Boolean(roomFromQr)}
          onJoined={() => setJoined(true)}
        />
      </div>
    );
  }

  return <GuestMessagePanel />;
}
