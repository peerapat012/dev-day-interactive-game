"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ensureGuestSession, getAccount } from "@/services/appwrite/auth";
import { createGuest } from "@/services/appwrite/guests";
import { getRoomByCode } from "@/services/appwrite/rooms";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

const MIN_NAME = 2;
const MAX_NAME = 20;

interface GuestNameFormProps {
  roomCode: string;
  onJoined: () => void;
}

export function GuestNameForm({ roomCode, onJoined }: GuestNameFormProps) {
  const storedName = usePlayerStore((s) => s.displayName);
  const setDisplayName = usePlayerStore((s) => s.setDisplayName);
  const setGuestMode = usePlayerStore((s) => s.setGuestMode);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setGuestId = useRoomStore((s) => s.setGuestId);
  const setHasSubmitted = useRoomStore((s) => s.setHasSubmitted);
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

      const room = await getRoomByCode(roomCode);
      if (!room) {
        throw new Error("Room not found. Check the QR code or ask the host.");
      }

      const guest = await createGuest(room.roomId, trimmed);

      try {
        await getAccount().updateName({ name: trimmed });
      } catch {
        /* name still saved locally and in guests table */
      }

      setDisplayName(trimmed);
      setGuestMode(true);
      setRoom(room.roomId, room.$id);
      setGuestId(guest.guestUuid);
      setHasSubmitted(guest.hasSubmitted);
      onJoined();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center px-4 pb-[env(safe-area-inset-bottom)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
      >
        <motion.div
          className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:p-8"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <p className="mb-4 text-center font-mono text-sm tracking-widest text-violet-300">
            Room {roomCode}
          </p>
          <label
            htmlFor="guest-name"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Your nickname
          </label>
          <Input
            id="guest-name"
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
            {loading ? "Joining…" : "Join lobby"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
