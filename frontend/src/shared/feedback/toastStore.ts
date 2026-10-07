import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  title?: string;
}

export const MAX_VISIBLE_TOASTS = 3;
const TOAST_DURATION_MS = 4000;
const ERROR_TOAST_DURATION_MS = 6000;

interface ToastState {
  toasts: Toast[];
  show: (tone: ToastTone, message: string, title?: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (tone, message, title) => {
    const id = nextId++;
    set((s) => ({
      toasts: [...s.toasts, { id, tone, message, title }].slice(
        -MAX_VISIBLE_TOASTS,
      ),
    }));
    setTimeout(
      () => get().dismiss(id),
      tone === "error" ? ERROR_TOAST_DURATION_MS : TOAST_DURATION_MS,
    );
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, title?: string) =>
    useToastStore.getState().show("success", message, title),
  error: (message: string, title?: string) =>
    useToastStore.getState().show("error", message, title),
  info: (message: string, title?: string) =>
    useToastStore.getState().show("info", message, title),
};
