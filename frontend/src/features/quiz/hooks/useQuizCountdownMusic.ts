"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuizPhase } from "@/types/quiz";

const MUSIC_SRC = "/audio/quiz-countdown.mp3";
const MUTED_KEY = "quiz-countdown-music-muted";
const MUTED_VALUE = "1";

export function useQuizCountdownMusic(phase: QuizPhase | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryRef = useRef<(() => void) | null>(null);

  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(MUTED_KEY) === MUTED_VALUE;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.8;
    audio.muted = muted;
    audioRef.current = audio;
    return () => {
      retryRef.current?.();
      retryRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MUTED_KEY, next ? MUTED_VALUE : "0");
      } catch {
        // Ignore storage failures (private mode etc.).
      }
      const audio = audioRef.current;
      if (audio) audio.muted = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const clearRetry = () => {
      retryRef.current?.();
      retryRef.current = null;
    };

    if (phase === "live") {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay policy blocked us (page had no gesture yet). Retry on the
        // next tap/keypress while the question is still live.
        let active = true;
        const onGesture = () => {
          if (!active) return;
          active = false;
          window.removeEventListener("pointerdown", onGesture);
          window.removeEventListener("keydown", onGesture);
          retryRef.current = null;
          void audio.play().catch(() => undefined);
        };
        window.addEventListener("pointerdown", onGesture);
        window.addEventListener("keydown", onGesture);
        retryRef.current = () => {
          if (!active) return;
          active = false;
          window.removeEventListener("pointerdown", onGesture);
          window.removeEventListener("keydown", onGesture);
        };
      });
    } else {
      clearRetry();
      audio.pause();
      audio.currentTime = 0;
    }

    return clearRetry;
  }, [phase]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onVisibility = () => {
      if (document.hidden) {
        audio.pause();
      } else if (phase === "live") {
        void audio.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);

  return { muted, toggleMute };
}
