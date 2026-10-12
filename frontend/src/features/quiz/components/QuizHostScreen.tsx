"use client";

import { confirmDialog } from "@/shared/feedback/dialogStore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DeckEditor } from "@/features/quiz/components/DeckEditor";
import { HostAuthChoice } from "@/features/quiz/components/HostAuthChoice";
import { HostGameControl } from "@/features/quiz/components/HostGameControl";
import { QuizMusicToggle } from "@/features/quiz/components/QuizMusicToggle";
import { useSwitchRoomMode } from "@/features/host/hooks/useSwitchRoomMode";
import { useQuizHost } from "@/features/quiz/hooks/useQuizHost";
import { ActionGroup, ActionRow } from "@/shared/ui/ActionGroup";
import { Button } from "@/shared/ui/Button";
import { ArrowLeftIcon } from "@/shared/ui/icons";

export function QuizHostScreen() {
  const router = useRouter();
  const host = useQuizHost();
  const { switching, switchMode } = useSwitchRoomMode(
    "quiz",
    host.roomId,
    host.roomRowId,
  );
  const inGame = Boolean(host.wfState && host.wfState.deck);
  const [authDismissed, setAuthDismissed] = useState(false);

  const gameState = useMemo(() => host.wfState, [host.wfState]);

  if (!host.ready || !host.authLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
        Preparing quiz host…
      </div>
    );
  }

  if (host.error || !host.roomId || !host.roomRowId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-danger">
          {host.error ?? "Could not open quiz host."}
        </p>
        <Button type="button" onClick={() => router.replace("/")}>
          Back to home
        </Button>
      </div>
    );
  }

  if (!host.user && !authDismissed && !inGame) {
    return (
      <HostAuthChoice
        onContinueGuest={() => setAuthDismissed(true)}
        onLogin={host.login}
        onRegister={host.register}
      />
    );
  }

  const phase = gameState?.phase;
  const showRoomActions = !inGame || phase === "lobby";

  function handleCloseRoom() {
    void confirmDialog({
      title: "Close this room?",
      message:
        "Guests will be cleared, the room link will stop working, and you will return to the home page.",
      confirmLabel: "Close room",
      tone: "danger",
    }).then((confirmed) => {
      if (confirmed) {
        void host.closeRoom().then(() => router.replace("/"));
      }
    });
  }

  function handleClearSession() {
    void confirmDialog({
      title: "Clear session?",
      message: "The deck will be cleared and you will start a fresh room.",
      confirmLabel: "Clear",
      tone: "danger",
    }).then((confirmed) => {
      if (confirmed) void host.clearSession();
    });
  }

  const roomActions = showRoomActions ? (
    <>
      <ActionGroup title="Session">
        <ActionRow description="Go back to the word cloud in this same room. The code and guests stay; their screens switch automatically.">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void switchMode()}
            disabled={switching || host.closing}
            className="w-full sm:w-auto"
          >
            {switching ? "Switching…" : "Switch to Word Cloud"}
          </Button>
        </ActionRow>
        {inGame ? (
          <ActionRow description="Need a fresh room code? Guests will use the new QR and link.">
            <Button
              type="button"
              variant="ghost"
              onClick={() => void host.createNewRoom()}
              disabled={host.creating || host.closing}
              className="w-full sm:w-auto"
            >
              {host.creating ? "Creating…" : "Create new room"}
            </Button>
          </ActionRow>
        ) : null}
      </ActionGroup>

      <ActionGroup title="Danger zone" tone="danger">
        {!inGame ? (
          <ActionRow description="Start over on this device: wipes the local deck and gives you a fresh room code.">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearSession}
              disabled={host.closing}
              className="w-full border-danger/30 text-danger sm:w-auto"
            >
              Clear session
            </Button>
          </ActionRow>
        ) : null}
        <ActionRow description="End the live session: connected guests are cleared locally, joins to this room stop working, and you return to the home page to host again later.">
          <Button
            type="button"
            variant="danger"
            onClick={handleCloseRoom}
            disabled={host.closing}
            className="w-full sm:w-auto"
          >
            {host.closing ? "Closing room…" : "Close room & end session"}
          </Button>
        </ActionRow>
      </ActionGroup>
    </>
  ) : null;

  return (
    <motion.div
      className={`mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-6 ${
        inGame
          ? "pb-[max(2rem,env(safe-area-inset-bottom))]"
          : "pb-[calc(9rem+env(safe-area-inset-bottom,0px))] lg:pb-8"
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="flex flex-col gap-3 pr-14">
        {inGame ? (
          <button
            type="button"
            onClick={host.backToEditor}
            className="-ml-2 inline-flex min-h-10 items-center gap-1.5 self-start rounded-full px-2 text-sm font-medium text-fg-muted transition-[transform,color] hover:text-fg active:scale-[0.96]"
          >
            <ArrowLeftIcon />
            Deck editor
          </button>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
            <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
              {inGame ? "Run the quiz" : "Build your quiz"}
            </h1>
            <p className="text-sm text-fg-muted">
              {inGame
                ? "Share the room, start questions, and reveal answers as you go."
                : "Write questions and options, then start when guests have joined."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AccountChip user={host.user} />
            <QuizMusicToggle phase={phase} />
          </div>
        </div>
      </header>

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
          lobbyAside={roomActions}
        />
      ) : (
        <DeckEditor
          initialDeck={host.deck}
          onStart={(deck) => void host.startGame(deck)}
          aside={roomActions}
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

function AccountChip({
  user,
}: {
  user: { name: string; email: string } | null;
}) {
  const signedIn = Boolean(user);
  return (
    <p
      className="inline-flex min-h-9 max-w-[16rem] items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs text-fg-secondary"
      title={
        signedIn
          ? "Decks save to your account."
          : "Your deck stays on this device. Log in under My saved decks to save it to your account."
      }
    >
      <span
        className={`size-2 shrink-0 rounded-full ${signedIn ? "bg-success" : "bg-accent"}`}
        aria-hidden
      />
      <span className="truncate">
        {user ? (
          <>
            Signed in as{" "}
            <span className="font-medium text-fg">{user.name || user.email}</span>
          </>
        ) : (
          "Hosting as guest · deck stays on this device"
        )}
      </span>
    </p>
  );
}
