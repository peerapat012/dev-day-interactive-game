"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GuestJoinForm } from "@/features/guest/components/GuestJoinForm";
import { GuestMessagePanel } from "@/features/guest/components/GuestMessagePanel";
import { useRoomClosedKick } from "@/features/guest/hooks/useRoomClosedKick";
import { clearGuestRoomSession } from "@/lib/clearGuestRoomSession";
import { bumpJoinFormEpoch, readJoinFormEpoch } from "@/lib/guestJoinDraft";
import { roomCodeFromSearchParams } from "@/lib/guestJoinUrl";
import { getRoomByCode } from "@/services/appwrite/rooms";
import { normalizeRoomCode } from "@/lib/roomCode";
import { onGuestStoresHydrated } from "@/lib/persistHydration";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

export function GuestScreen() {
  const searchParams = useSearchParams();
  const guestMode = usePlayerStore((s) => s.guestMode);
  const displayName = usePlayerStore((s) => s.displayName);
  const storedRoomId = useRoomStore((s) => s.roomId);
  const guestId = useRoomStore((s) => s.guestId);
  const [storesReady, setStoresReady] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinFormEpoch, setJoinFormEpoch] = useState(() => readJoinFormEpoch());

  const resetJoinForm = useCallback(() => {
    bumpJoinFormEpoch();
    setJoinFormEpoch(readJoinFormEpoch());
  }, []);

  const onRoomClosedByHost = useCallback(() => {
    resetJoinForm();
    setJoined(false);
  }, [resetJoinForm]);

  useRoomClosedKick(joined, onRoomClosedByHost);

  const roomFromQr = useMemo(
    () => roomCodeFromSearchParams(searchParams),
    [searchParams],
  );

  const qrRoomResolved = roomFromQr.length > 0;

  useEffect(() => onGuestStoresHydrated(() => setStoresReady(true)), []);

  /**
   * Manual join: if the saved room was closed by the host, wipe persist and reset the form.
   */
  useEffect(() => {
    if (!storesReady || joined || qrRoomResolved) return;

    const stored = normalizeRoomCode(storedRoomId);
    if (!stored) return;

    let cancelled = false;
    void getRoomByCode(stored).then((room) => {
      if (cancelled || room) return;
      clearGuestRoomSession();
      resetJoinForm();
    });

    return () => {
      cancelled = true;
    };
  }, [storesReady, joined, qrRoomResolved, storedRoomId, resetJoinForm]);

  /** QR points at a different room than persisted session — drop stale room before join/resume. */
  useEffect(() => {
    if (!storesReady || !qrRoomResolved) return;
    const stored = normalizeRoomCode(storedRoomId);
    if (stored && stored !== roomFromQr) {
      clearGuestRoomSession();
      resetJoinForm();
      setJoined(false);
    }
  }, [storesReady, qrRoomResolved, roomFromQr, storedRoomId, resetJoinForm]);

  /** Only skip the join form when QR matches the saved session (not for manual entry). */
  const resumeFromQr =
    qrRoomResolved &&
    Boolean(storedRoomId) &&
    roomFromQr === normalizeRoomCode(storedRoomId);

  useEffect(() => {
    if (!storesReady) return;

    if (
      resumeFromQr &&
      guestMode &&
      displayName.trim() &&
      guestId &&
      storedRoomId
    ) {
      setJoined(true);
    } else if (qrRoomResolved && storedRoomId && !resumeFromQr) {
      setJoined(false);
    }
  }, [
    storesReady,
    guestMode,
    displayName,
    guestId,
    storedRoomId,
    roomFromQr,
    qrRoomResolved,
    resumeFromQr,
  ]);

  useEffect(() => {
    if (!storesReady) return;
    if (joined && !guestId.trim() && guestMode && storedRoomId) {
      setJoined(false);
    }
  }, [storesReady, joined, guestId, guestMode, storedRoomId]);

  if (!storesReady) {
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
          key={qrRoomResolved ? `qr-${roomFromQr}-${joinFormEpoch}` : `manual-${joinFormEpoch}`}
          initialRoomCode={roomFromQr}
          formEpoch={joinFormEpoch}
          fromQr={qrRoomResolved}
          onJoined={() => setJoined(true)}
          onSessionCleared={resetJoinForm}
        />
      </div>
    );
  }

  return (
    <GuestMessagePanel
      onLeaveRoom={() => {
        resetJoinForm();
        setJoined(false);
      }}
    />
  );
}
