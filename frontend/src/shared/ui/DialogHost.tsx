"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useDialogStore } from "@/shared/feedback/dialogStore";
import { Button } from "@/shared/ui/Button";

const subscribeNoop = () => () => undefined;

export function DialogHost() {
  const head = useDialogStore((s) => s.queue[0]);
  const resolveHead = useDialogStore((s) => s.resolveHead);
  const reduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const safeButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headId = head?.id;

  useEffect(() => {
    if (headId === undefined) return;
    const previous = document.activeElement as HTMLElement | null;
    safeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        resolveHead(false);
        return;
      }
      if (e.key !== "Tab" || !cardRef.current) return;
      const buttons = cardRef.current.querySelectorAll<HTMLButtonElement>("button");
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [headId, resolveHead]);

  if (!mounted) return null;

  const danger = head?.tone === "danger";
  const isConfirm = head?.kind === "confirm";
  const cancelIsSafe = danger && isConfirm;

  return createPortal(
    <AnimatePresence>
      {head ? (
        <div
          key={head.id}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => resolveHead(false)}
          />
          <motion.div
            ref={cardRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`dialog-title-${head.id}`}
            aria-describedby={`dialog-msg-${head.id}`}
            className="relative z-[90] w-full max-w-sm rounded-3xl border border-line bg-background p-6 shadow-2xl"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
                danger
                  ? "bg-danger-soft text-danger"
                  : "bg-primary-soft text-primary-text"
              }`}
              aria-hidden="true"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {danger ? (
                  <>
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                    <path d="M12 9v4M12 17h.01" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </>
                )}
              </svg>
            </div>
            <h2
              id={`dialog-title-${head.id}`}
              className="text-lg font-semibold text-fg"
            >
              {head.title}
            </h2>
            <p
              id={`dialog-msg-${head.id}`}
              className="mt-2 text-sm leading-relaxed text-fg-muted"
            >
              {head.message}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {isConfirm ? (
                <Button
                  type="button"
                  variant="ghost"
                  ref={cancelIsSafe ? safeButtonRef : undefined}
                  onClick={() => resolveHead(false)}
                >
                  {head.cancelLabel ?? "Cancel"}
                </Button>
              ) : null}
              <Button
                type="button"
                variant={danger ? "danger" : "primary"}
                ref={cancelIsSafe ? undefined : safeButtonRef}
                onClick={() => resolveHead(true)}
              >
                {head.confirmLabel ?? "OK"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
