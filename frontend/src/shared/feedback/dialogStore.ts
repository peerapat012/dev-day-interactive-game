import { create } from "zustand";

export type DialogTone = "default" | "danger";

interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
}

export interface DialogRequest extends DialogOptions {
  id: number;
  kind: "alert" | "confirm";
  resolve: (confirmed: boolean) => void;
}

interface DialogState {
  queue: DialogRequest[];
  push: (request: Omit<DialogRequest, "id">) => void;
  resolveHead: (confirmed: boolean) => void;
}

let nextId = 1;

export const useDialogStore = create<DialogState>((set, get) => ({
  queue: [],
  push: (request) =>
    set((s) => ({ queue: [...s.queue, { ...request, id: nextId++ }] })),
  resolveHead: (confirmed) => {
    const head = get().queue[0];
    if (!head) return;
    set((s) => ({ queue: s.queue.slice(1) }));
    head.resolve(confirmed);
  },
}));

export function confirmDialog(options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    useDialogStore.getState().push({ ...options, kind: "confirm", resolve });
  });
}

export function alertDialog(options: DialogOptions): Promise<void> {
  return new Promise((resolve) => {
    useDialogStore
      .getState()
      .push({ ...options, kind: "alert", resolve: () => resolve() });
  });
}
