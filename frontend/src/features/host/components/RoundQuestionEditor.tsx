"use client";

import { useState } from "react";
import { ROUND_QUESTION_MAX_LENGTH } from "@/lib/constants";
import { updateRoundQuestion } from "@/services/appwrite/rooms";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { RoundQuestionCard } from "@/shared/ui/RoundQuestionCard";

interface RoundQuestionEditorProps {
  roomRowId: string;
  question: string;
  onSaved: (question: string) => void;
}

/** Host control to set the optional question guests answer in this round. */
export function RoundQuestionEditor({
  roomRowId,
  question,
  onSaved,
}: RoundQuestionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraft(question);
    setError(null);
    setEditing(true);
  }

  async function save(next: string) {
    setSaving(true);
    setError(null);
    try {
      const room = await updateRoundQuestion(roomRowId, next);
      onSaved(room.roundQuestion ?? "");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the question");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        <RoundQuestionCard question={question} />
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={startEditing} className="px-4 py-2 text-sm">
            {question.trim() ? "Edit question" : "Set round question (optional)"}
          </Button>
          {!question.trim() ? (
            <p className="text-xs text-zinc-500">
              Guests see it and AI groups answers to it.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save(draft);
      }}
    >
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. What worries you most about using AI?"
        maxLength={ROUND_QUESTION_MAX_LENGTH}
        disabled={saving}
        autoFocus
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving} className="px-4 py-2 text-sm">
          {saving ? "Saving…" : "Save question"}
        </Button>
        {question.trim() ? (
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => void save("")}
            className="px-4 py-2 text-sm text-rose-300"
          >
            Clear question
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          onClick={() => setEditing(false)}
          className="px-4 py-2 text-sm"
        >
          Cancel
        </Button>
      </div>
      <p className="text-xs text-zinc-500">
        Changing it mid-round affects how the next summary is generated.
      </p>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </form>
  );
}
