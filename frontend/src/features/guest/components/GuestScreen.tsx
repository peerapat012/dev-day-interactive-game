"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GuestJoinForm } from "@/features/guest/components/GuestJoinForm";
import { GuestMessagePanel } from "@/features/guest/components/GuestMessagePanel";
import { useRoomClosedKick } from "@/features/guest/hooks/useRoomClosedKick";
import { clearGuestRoomSession } from "@/lib/clearGuestRoomSession";
import { bumpJoinFormEpoch, readJoinFormEpoch } from "@/lib/guestJoinDraft";
import {
  guestPathWithRoom,
  roomCodeFromSearchParams,
} from "@/lib/guestJoinUrl";
import { resetGuestJoinSession } from "@/lib/guestJoinReset";
import { getRoomByCode } from "@/services/appwrite/rooms";
import { normalizeRoomCode } from "@/lib/roomCode";
import { onGuestStoresHydrated } from "@/lib/persistHydration";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";

export function GuestScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestMode = usePlayerStore((s) => s.guestMode);
  const displayName = usePlayerStore((s) => s.displayName);
  const storedRoomId = useRoomStore((s) => s.roomId);
  const guestId = useRoomStore((s) => s.guestId);
  const [storesReady, setStoresReady] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinFormEpoch, setJoinFormEpoch] = useState(() => readJoinFormEpoch());

  const resetJoinForm = useCallback(async () => {
    const epoch = await resetGuestJoinSession((path) => router.replace(path));
    setJoinFormEpoch(epoch);
    setJoined(false);
  }, [router]);

  const onRoomClosedByHost = useCallback(() => {
    void resetJoinForm();
  }, [resetJoinForm]);

  useRoomClosedKick(joined, onRoomClosedByHost);

  const roomFromUrl = useMemo(
    () => roomCodeFromSearchParams(searchParams),
    [searchParams],
  );

  const qrRoomResolved = roomFromUrl.length > 0;

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
      void resetJoinForm();
    });

    return () => {
      cancelled = true;
    };
  }, [storesReady, joined, qrRoomResolved, storedRoomId, resetJoinForm]);

  /** QR URL differs from persisted session — drop stale room but keep `?room=` for the scan. */
  useEffect(() => {
    if (!storesReady || !qrRoomResolved || joined) return;
    const stored = normalizeRoomCode(storedRoomId);
    if (stored && stored !== roomFromUrl) {
      clearGuestRoomSession();
      setJoinFormEpoch(bumpJoinFormEpoch());
    }
  }, [storesReady, joined, qrRoomResolved, roomFromUrl, storedRoomId]);

  /** Only auto-enter lobby when QR URL matches the saved session (never while already joined). */
  const resumeFromQr =
    qrRoomResolved &&
    Boolean(storedRoomId) &&
    roomFromUrl === normalizeRoomCode(storedRoomId);

  useEffect(() => {
    if (!storesReady || joined) return;

    if (
      resumeFromQr &&
      guestMode &&
      displayName.trim() &&
      guestId &&
      storedRoomId
    ) {
      setJoined(true);
    }
  }, [
    storesReady,
    joined,
    guestMode,
    displayName,
    guestId,
    storedRoomId,
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
            {roomFromUrl ? (
              <>
                Room{" "}
                <span className="font-mono font-semibold text-violet-300">
                  {roomFromUrl}
                </span>{" "}
                from QR — confirm the code and enter your nickname.
              </>
            ) : (
              "Enter the room code from the host (or scan their QR) and your nickname."
            )}
          </p>
        </motion.div>

        <GuestJoinForm
          key={qrRoomResolved ? `qr-${roomFromUrl}-${joinFormEpoch}` : `manual-${joinFormEpoch}`}
          initialRoomCode={roomFromUrl}
          formEpoch={joinFormEpoch}
          fromQr={qrRoomResolved}
          onJoined={(joinedRoomCode) => {
            const joined = normalizeRoomCode(joinedRoomCode);
            if (joined && joined !== roomFromUrl) {
              router.replace(guestPathWithRoom(joined));
            }
            setJoined(true);
          }}
          onSessionCleared={() => void resetJoinForm()}
        />
      </div>
    );
  }

  return (
    <GuestMessagePanel
      onLeaveRoom={() => {
        void resetJoinForm();
      }}
    />
  );
}
