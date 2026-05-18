"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";

const PUBLIC_PATHS = ["/lobby"];

export function PlayerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const displayName = usePlayerStore((s) => s.displayName);
  const [ready, setReady] = useState(false);

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
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (!isPublic && !displayName.trim()) {
      router.replace("/lobby");
    }
  }, [ready, pathname, displayName, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isPublic && !displayName.trim()) {
    return null;
  }

  return <>{children}</>;
}
