"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useSubmitEntry } from "@/features/cloud/hooks/useSubmitEntry";
import { useEntriesStore } from "@/store/entriesStore";

export function CloudInput() {
  const [text, setText] = useState("");
  const { submit, isSubmitting } = useSubmitEntry();
  const error = useEntriesStore((s) => s.error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(text);
    setText("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-md sm:flex-row"
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a short phrase…"
        disabled={isSubmitting}
        maxLength={200}
      />
      <Button type="submit" disabled={isSubmitting || !text.trim()}>
        {isSubmitting ? "Sending…" : "Send"}
      </Button>
      {error ? (
        <p className="text-sm text-rose-400 sm:col-span-2">{error}</p>
      ) : null}
    </form>
  );
}
