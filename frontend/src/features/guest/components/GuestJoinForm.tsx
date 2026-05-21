"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";
import { clearGuestRoomSession } from "@/lib/clearGuestRoomSession";
import { leaveGuestRoom } from "@/lib/leaveGuestRoom";
import { normalizeRoomCode } from "@/lib/roomCode";
import { ensureGuestSession, getAccount } from "@/services/appwrite/auth";
import { createGuest } from "@/services/appwrite/guests";
import { getRoomByCode } from "@/services/appwrite/rooms";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

const MIN_NAME = 2;
const MAX_NAME = 20;
const MIN_ROOM_CODE = 4;
const MAX_ROOM_CODE = 12;

interface GuestJoinFormProps {
  /** Prefill from `?room=` on QR / guest link — user can still edit before joining. */
  initialRoomCode?: string;
  /** Changes when session was cleared — remounts inputs. */
  formEpoch?: number;
  fromQr?: boolean;
  /** Called with the room code the guest actually joined. */
  onJoined: (joinedRoomCode: string) => void;
  onSessionCleared?: () => void | Promise<void>;
}

export function GuestJoinForm({
  initialRoomCode = "",
  formEpoch = 0,
  fromQr = false,
  onJoined,
  onSessionCleared,
}: GuestJoinFormProps) {
  const roomFieldId = useId();
  const urlPrefill = normalizeRoomCode(initialRoomCode);

  const setDisplayName = usePlayerStore((s) => s.setDisplayName);
  const setGuestMode = usePlayerStore((s) => s.setGuestMode);
  const setRoom = useRoomStore((s) => s.setRoom);
  const setGuestId = useRoomStore((s) => s.setGuestId);
  const setHasSubmitted = useRoomStore((s) => s.setHasSubmitted);

  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState(() => (urlPrefill ? urlPrefill : ""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trimmedName = name.trim();
  const roomCode = normalizeRoomCode(roomInput);
  const nameValid =
    trimmedName.length >= MIN_NAME && trimmedName.length <= MAX_NAME;
  const roomValid =
    roomCode.length >= MIN_ROOM_CODE && roomCode.length <= MAX_ROOM_CODE;
  const canJoin = nameValid && roomValid;

  function handleRoomInputChange(raw: string) {
    const next = raw.toUpperCase();
    setRoomInput(next);

    const typed = normalizeRoomCode(next);
    const stored = normalizeRoomCode(useRoomStore.getState().roomId);
    if (stored && typed && typed !== stored) {
      clearGuestRoomSession();
    }
  }

  async function handleJoin() {
    if (!canJoin || loading) return;

    setLoading(true);
    setError(null);

    try {
      await ensureGuestSession();

      const stored = normalizeRoomCode(useRoomStore.getState().roomId);
      if (stored && stored !== roomCode) {
        clearGuestRoomSession();
      }

      const room = await getRoomByCode(roomCode);
      if (!room) {
        throw new Error(
          "Room not found or this session has ended. Ask your host for a new room code.",
        );
      }

      const guest = await createGuest(room.roomId, trimmedName);

      try {
        await getAccount().updateName({ name: trimmedName });
      } catch {
        /* name still saved locally and in guests table */
      }

      setDisplayName(trimmedName);
      setGuestMode(true);
      setRoom(room.roomId, room.$id);
      setGuestId(guest.guestUuid);
      setHasSubmitted(guest.hasSubmitted);
      onJoined(roomCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setLoading(false);
    }
  }

  async function handleClearDevice() {
    if (
      !window.confirm(
        "Clear saved room and nickname on this device? You can join again with a fresh room code.",
      )
    ) {
      return;
    }
    await leaveGuestRoom();
    setName("");
    setRoomInput("");
    setError(null);
    await onSessionCleared?.();
  }

  const roomInputKey = `room-${formEpoch}-${urlPrefill || "manual"}`;

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
          {fromQr && urlPrefill ? (
            <p className="mb-4 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-center text-sm text-violet-200">
              Scanned room{" "}
              <span className="font-mono font-bold tracking-widest">
                {urlPrefill}
              </span>
            </p>
          ) : null}

          <label
            htmlFor={roomFieldId}
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Room code
          </label>
          <Input
            key={roomInputKey}
            id={roomFieldId}
            name={roomInputKey}
            value={roomInput}
            onChange={(e) => handleRoomInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleJoin();
            }}
            placeholder="e.g. ABC123"
            maxLength={MAX_ROOM_CODE}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            data-lpignore="true"
            data-1p-ignore="true"
            autoFocus={!urlPrefill}
            className="mb-1 text-center font-mono text-lg font-semibold tracking-widest"
          />
          <p className="mb-5 text-center text-xs text-zinc-500">
            {MIN_ROOM_CODE}–{MAX_ROOM_CODE} letters or numbers
          </p>

          <label
            htmlFor="guest-name"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Your nickname
          </label>
          <Input
            key={`name-${formEpoch}`}
            id="guest-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleJoin();
            }}
            placeholder="e.g. Alex"
            maxLength={MAX_NAME}
            autoComplete="off"
            autoFocus={Boolean(urlPrefill)}
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
            disabled={!canJoin || loading}
            onClick={() => void handleJoin()}
            className="w-full py-4 text-base font-semibold"
          >
            {loading ? "Joining…" : "Join room"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleClearDevice()}
            disabled={loading}
            className="mt-3 w-full text-sm text-zinc-500 hover:text-rose-300"
          >
            Clear saved session on this device
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
