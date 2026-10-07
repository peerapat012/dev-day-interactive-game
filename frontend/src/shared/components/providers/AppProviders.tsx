"use client";

import { useEffect } from "react";
import { useRealtimeEntries } from "@/features/cloud/hooks/useRealtimeEntries";
import { ensureGuestSession } from "@/services/appwrite/auth";
import { useThemeStore } from "@/shared/theme/themeStore";
import { PlayerGate } from "@/shared/components/PlayerGate";
import { DialogHost } from "@/shared/ui/DialogHost";
import { Toaster } from "@/shared/ui/Toaster";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useRealtimeEntries();

  useEffect(() => {
    useThemeStore.getState().syncFromDocument();
    void ensureGuestSession().catch(() => undefined);
  }, []);

  return (
    <>
      <PlayerGate>{children}</PlayerGate>
      <DialogHost />
      <Toaster />
    </>
  );
}
