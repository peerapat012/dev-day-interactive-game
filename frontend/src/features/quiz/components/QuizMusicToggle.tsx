"use client";

import { useQuizCountdownMusic } from "@/features/quiz/hooks/useQuizCountdownMusic";
import type { QuizPhase } from "@/types/quiz";

export function QuizMusicToggle({
  phase,
}: {
  phase: QuizPhase | undefined;
}) {
  const { muted, toggleMute } = useQuizCountdownMusic(phase);

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label={muted ? "Unmute countdown music" : "Mute countdown music"}
      aria-pressed={muted}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-sm text-zinc-300 transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] hover:bg-white/10"
    >
      {muted ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}