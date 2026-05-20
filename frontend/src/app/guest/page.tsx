import type { Metadata } from "next";
import { Suspense } from "react";
import { GuestScreen } from "@/features/guest/components/GuestScreen";

export const metadata: Metadata = {
  title: "Guest — Word Cloud Game",
  description: "Join the game as a guest and submit phrases",
};

export default function GuestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <GuestScreen />
    </Suspense>
  );
}
