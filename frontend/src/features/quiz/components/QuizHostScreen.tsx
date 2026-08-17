"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DeckEditor } from "@/features/quiz/components/DeckEditor";
import { HostGameControl } from "@/features/quiz/components/HostGameControl";
import { useQuizHost } from "@/features/quiz/hooks/useQuizHost";
import { Button } from "@/shared/ui/Button";

export function QuizHostScreen() {
  const router = useRouter();
  const host = useQuizHost();
  const inGame = Boolean(host.wfState && host.wfState.deck);

  const gameState = useMemo(() => host.wfState, [host.wfState]);

  if (!host.ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Preparing quiz host…
      </div>
    );
  }

  if (host.error || !host.roomId || !host.roomRowId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-rose-400">
          {host.error ?? "Could not open quiz host."}
        </p>
        <Button type="button" onClick={() => router.replace("/")}>
          Back to home
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:py-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <header className="flex flex-col gap-1">
        {inGame ? (
          <button
            type="button"
            onClick={host.backToEditor}
            className="mb-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-transform active:scale-[0.96] hover:bg-white/10"
          >
            ← Back to deck editor
          </button>
        ) : null}
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400 sm:text-xs">
          Quiz host
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          {inGame ? "Run the quiz" : "Build your quiz"}
        </h1>
        <p className="text-xs text-zinc-400 sm:text-sm">
          {inGame
            ? "Share the room, start questions, and reveal answers as you go."
            : "Write questions and options, then start when guests have joined."}
        </p>
      </header>

      {host.user ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
            ✓
          </span>
          <p className="text-xs text-emerald-200/90">
            Signed in as{" "}
            <span className="font-medium text-emerald-100">
              {host.user.name || host.user.email}
            </span>{" "}
            — decks save to your account.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
            ?
          </span>
          <p className="text-xs text-amber-200/90">
            Hosting as a guest — your deck stays on this device.{" "}
            <span className="font-medium text-amber-100">
              Log in to save decks to your account.
            </span>
          </p>
        </div>
      )}

      {inGame && gameState ? (
        <HostGameControl
          roomId={host.roomId}
          state={gameState}
          guests={host.guests}
          onStartQuestion={host.startQuestion}
          onReveal={host.reveal}
          onShowLeaderboard={host.showLeaderboard}
          onNextQuestion={host.nextQuestion}
          onEndGame={host.endGame}
          onCreateNewRoom={host.createNewRoom}
          creating={host.creating}
        />
      ) : (
        <DeckEditor
          initialDeck={host.deck}
          onStart={(deck) => void host.startGame(deck)}
          onClearSession={() => void host.clearSession()}
          auth={{
            user: host.user,
            login: host.login,
            register: host.register,
            logout: host.logout,
            savedDecks: host.savedDecks,
            refreshDecks: host.refreshDecks,
            saveDeckToCloud: host.saveDeckToCloud,
            deleteDeckFromCloud: host.deleteDeckFromCloud,
          }}
        />
      )}
    </motion.div>
  );
}
