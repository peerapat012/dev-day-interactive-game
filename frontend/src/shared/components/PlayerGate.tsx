"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isGuestPath } from "@/lib/guestPaths";
import { isHostPath } from "@/lib/hostPaths";
import { usePlayerStore } from "@/store/playerStore";

const PUBLIC_PATHS = ["/lobby", "/guest", "/host"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function PlayerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const displayName = usePlayerStore((s) => s.displayName);
  const guestMode = usePlayerStore((s) => s.guestMode);
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

    // Guest flow locks to /guest, but /host is always reachable (e.g. same device as presenter).
    if (guestMode && !isGuestPath(pathname) && !isHostPath(pathname)) {
      router.replace("/guest");
      return;
    }

    const isPublic = isPublicPath(pathname);
    if (!isPublic && !displayName.trim()) {
      router.replace(guestMode ? "/guest" : "/lobby");
    }
  }, [ready, pathname, displayName, guestMode, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (guestMode && !isGuestPath(pathname) && !isHostPath(pathname)) {
    return null;
  }

  const isPublic = isPublicPath(pathname);
  if (!isPublic && !displayName.trim()) {
    return null;
  }

  return <>{children}</>;
}
