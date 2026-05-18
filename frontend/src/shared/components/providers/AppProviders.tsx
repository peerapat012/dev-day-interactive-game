"use client";

import { useEffect } from "react";
import { useRealtimeEntries } from "@/features/cloud/hooks/useRealtimeEntries";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { closeEntriesRealtime } from "@/services/appwrite/realtime";
import { PlayerGate } from "@/shared/components/PlayerGate";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useRealtimeEntries();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    void ensureGuestSession().catch(() => undefined);
    return () => {
      closeEntriesRealtime();
    };
  }, []);

  return <PlayerGate>{children}</PlayerGate>;
}
