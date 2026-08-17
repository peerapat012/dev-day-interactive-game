"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthForm } from "@/features/quiz/components/AuthForm";
import { Button } from "@/shared/ui/Button";

interface HostAuthChoiceProps {
  onContinueGuest: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

type View = "choice" | "auth";

export function HostAuthChoice({
  onContinueGuest,
  onLogin,
  onRegister,
}: HostAuthChoiceProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("choice");

  return (
    <motion.div
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-6 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-[max(1.25rem,env(safe-area-inset-top))]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <motion.div
        className="flex w-full flex-col gap-5 rounded-3xl border border-white/10 bg-zinc-900/70 p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex flex-col gap-1 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400 sm:text-xs">
            Quiz host
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
            How do you want to host?
          </h1>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Host as a guest for a quick quiz on this device, or log in to save
            decks to your account and reuse them across devices.
          </p>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {view === "choice" ? (
            <motion.div
              key="choice"
              className="flex flex-col gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              <Button type="button" onClick={onContinueGuest} className="w-full">
                Continue as guest
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setView("auth")}
                className="w-full"
              >
                Log in or register
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <AuthForm onLogin={onLogin} onRegister={onRegister} />
              <button
                type="button"
                onClick={() => setView("choice")}
                className="min-h-[40px] self-center rounded-full px-3 text-xs text-zinc-400 transition-transform active:scale-[0.96]"
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <button
        type="button"
        onClick={() => router.replace("/")}
        className="min-h-[40px] rounded-full px-3 text-xs text-zinc-400 transition-transform active:scale-[0.96]"
      >
        ← Back to home
      </button>
    </motion.div>
  );
}
