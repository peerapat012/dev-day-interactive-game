"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Stack above another open modal (e.g. Show more inside summary history). */
  elevated?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  elevated = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const backdropZ = elevated ? "z-[60]" : "z-40";
  const panelZ = elevated ? "z-[70]" : "z-50";

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className={`fixed inset-0 ${backdropZ} bg-black/60 backdrop-blur-sm`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed inset-x-0 bottom-0 ${panelZ} flex max-h-[min(85dvh,640px)] flex-col rounded-t-3xl border border-white/10 border-b-0 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-xl md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-none md:border-b md:border-l md:p-6`}
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/20 md:hidden" />
            <motion.div
              className="mb-4 flex items-center justify-between gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-semibold capitalize text-zinc-100">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] rounded-full px-3 text-sm text-zinc-400 active:bg-white/10 active:text-zinc-100"
              >
                Close
              </button>
            </motion.div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
