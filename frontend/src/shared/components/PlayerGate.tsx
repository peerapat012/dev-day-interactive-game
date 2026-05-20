"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isGuestPath } from "@/lib/guestPaths";
import { isHomePath } from "@/lib/homePaths";
import { HOST_PATH, isHostPath } from "@/lib/hostPaths";
import { isLegacyGamePath } from "@/lib/gameNav";
import { usePlayerStore } from "@/store/playerStore";

const PUBLIC_PATHS = ["/", "/lobby", "/guest", "/host"];

function isPublicPath(pathname: string): boolean {
  return (
    isHomePath(pathname) ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
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

    if (isLegacyGamePath(pathname)) {
      router.replace(HOST_PATH);
      return;
    }

    // Guest flow locks to /guest, but /host and home are still reachable.
    if (
      guestMode &&
      !isGuestPath(pathname) &&
      !isHostPath(pathname) &&
      !isHomePath(pathname)
    ) {
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      router.replace(search ? `/guest${search}` : "/guest");
      return;
    }

    const isPublic = isPublicPath(pathname);
    if (!isPublic && !displayName.trim()) {
      router.replace(guestMode ? "/guest" : "/");
    }
  }, [ready, pathname, displayName, guestMode, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (isLegacyGamePath(pathname)) {
    return null;
  }

  if (
    guestMode &&
    !isGuestPath(pathname) &&
    !isHostPath(pathname) &&
    !isHomePath(pathname)
  ) {
    return null;
  }

  const isPublic = isPublicPath(pathname);
  if (!isPublic && !displayName.trim()) {
    return null;
  }

  return <>{children}</>;
}
