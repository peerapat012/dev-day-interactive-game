"use client";

import { useEffect, useRef, useState } from "react";

interface UseQuizCountdownOptions {
  active: boolean;
  startedAtMs: number | null;
  timeLimitMs: number;
  onExpire?: () => void;
}

/** Local ticking countdown for the live phase (host-anchored clock). */
export function useQuizCountdown({
  active,
  startedAtMs,
  timeLimitMs,
  onExpire,
}: UseQuizCountdownOptions): number {
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!active || startedAtMs === null) {
      return;
    }

    let expired = false;

    const tick = () => {
      const remaining = startedAtMs + timeLimitMs - Date.now();
      setNow(Date.now());
      if (remaining <= 0 && !expired) {
        expired = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [active, startedAtMs, timeLimitMs]);

  if (!active || startedAtMs === null) {
    return 0;
  }

  return Math.max(0, startedAtMs + timeLimitMs - now);
}
