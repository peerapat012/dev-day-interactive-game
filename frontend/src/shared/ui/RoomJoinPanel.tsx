"use client";

import { useMemo, useState, type ReactNode } from "react";
import { buildGuestJoinUrl } from "@/lib/guestJoinUrl";
import { Button } from "@/shared/ui/Button";

const COPIED_RESET_MS = 2000;

/** Projector-first join block: QR, room code, and copy actions. */
export function RoomJoinPanel({
  roomId,
  footer,
  className = "",
}: {
  roomId: string;
  footer?: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const guestUrl = useMemo(() => buildGuestJoinUrl(roomId), [roomId]);
  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(guestUrl)}`,
    [guestUrl],
  );

  async function copy(text: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), COPIED_RESET_MS);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section
      aria-label="Join this room"
      className={`flex flex-col items-center rounded-3xl border border-line bg-surface px-5 py-8 sm:px-8 ${className}`}
    >
      <div className="rounded-2xl bg-white p-3 shadow-[0_12px_32px_-12px_rgb(0_80_252/0.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt={`QR code for room ${roomId}`}
          width={280}
          height={280}
          className="block h-auto w-[min(280px,68vw)] lg:w-[min(340px,30vw)]"
        />
      </div>

      <p className="mt-6 text-sm text-fg-muted">Scan or enter room code</p>
      <p className="mt-1 font-mono text-4xl font-bold tracking-[0.2em] text-primary-text tabular-nums sm:text-5xl">
        {roomId}
      </p>

      <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
        <Button type="button" variant="ghost" onClick={() => void copy(roomId, "code")}>
          {copied === "code" ? "Code copied!" : "Copy room ID"}
        </Button>
        <Button type="button" onClick={() => void copy(guestUrl, "link")}>
          {copied === "link" ? "Link copied!" : "Copy guest link"}
        </Button>
      </div>
      <p className="mt-3 w-full max-w-sm break-all text-center text-xs text-fg-muted">
        {guestUrl}
      </p>
      {footer}
    </section>
  );
}
