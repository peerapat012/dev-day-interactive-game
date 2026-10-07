"use client";

import { confirmDialog } from "@/shared/feedback/dialogStore";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { AuthForm } from "@/features/quiz/components/AuthForm";
import { optionColorAt, optionLetter } from "@/features/quiz/components/quizOptionStyles";
import {
  addDraftOption,
  generatedQuestionsToDraft,
  MAX_DRAFT_OPTIONS,
  MIN_DRAFT_OPTIONS,
  removeDraftOption,
  uid,
  type DraftQuestion,
} from "@/lib/generatedQuestionsToDraft";
import { generateQuestions } from "@/services/ai/generateQuestions";
import type { QuestionDeck, QuizQuestion } from "@/types/quiz";

interface DeckEditorProps {
  initialDeck: QuestionDeck | null;
  onStart: (deck: QuestionDeck) => void;
  onClearSession: () => void;
  auth: {
    user: { id: string; email: string; name: string } | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    savedDecks: { $id: string; name: string; questions: QuizQuestion[] }[];
    refreshDecks: () => Promise<void>;
    saveDeckToCloud: (deck: QuestionDeck) => Promise<unknown>;
    deleteDeckFromCloud: (rowId: string) => Promise<void>;
  };
}

const TIME_LIMITS_MS = [10000, 20000, 30000, 60000];
const GENERATION_LANGUAGES = ["Thai", "English"] as const;

function emptyQuestion(): DraftQuestion {
  const options = Array.from({ length: MIN_DRAFT_OPTIONS }, () => ({
    id: uid(),
    text: "",
  }));
  return {
    id: uid(),
    prompt: "",
    options,
    correctOptionId: options[0].id,
    timeLimitMs: 20000,
  };
}

function deckToDraft(deck: QuestionDeck): DraftQuestion[] {
  return deck.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options.map((option) => ({
      id: option.id,
      text: option.text,
    })),
    correctOptionId: question.correctOptionId,
    timeLimitMs: question.timeLimitMs,
  }));
}

function draftToDeck(name: string, questions: DraftQuestion[]): QuestionDeck {
  return {
    id: uid(),
    name: name.trim() || "Untitled quiz",
    questions: questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: question.options.filter((option) => option.text.trim()),
      correctOptionId: question.correctOptionId,
      timeLimitMs: question.timeLimitMs,
    })),
  };
}

function isQuestionValid(question: DraftQuestion): boolean {
  const validOptions = question.options.filter((option) => option.text.trim());
  return (
    question.prompt.trim().length > 0 &&
    validOptions.length >= 2 &&
    validOptions.some((option) => option.id === question.correctOptionId)
  );
}

export function DeckEditor({ initialDeck, onStart, onClearSession, auth }: DeckEditorProps) {
  const [name, setName] = useState(initialDeck?.name ?? "");
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    initialDeck ? deckToDraft(initialDeck) : [emptyQuestion()],
  );
  const [authOpen, setAuthOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiOptionCount, setAiOptionCount] = useState(4);
  const [aiLanguage, setAiLanguage] =
    useState<(typeof GENERATION_LANGUAGES)[number]>("Thai");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDone, setAiDone] = useState(0);

  const valid = useMemo(
    () => questions.length > 0 && questions.every(isQuestionValid),
    [questions],
  );

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) =>
      prev.map((question, i) => (i === index ? { ...question, ...patch } : question)),
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOption(    questionIndex: number,
    optionId: string,
    text: string,
  ) {
    setQuestions((prev) =>
      prev.map((question, i) => {
        if (i !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option) =>
            option.id === optionId ? { ...option, text } : option,
          ),
        };
      }),
    );
  }

  function addOption(questionIndex: number) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i === questionIndex ? addDraftOption(question) : question,
      ),
    );
  }

  function removeOption(questionIndex: number, optionId: string) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i === questionIndex ? removeDraftOption(question, optionId) : question,
      ),
    );
  }

  function loadDeckIntoEditor(deck: {
    $id: string;
    name: string;
    questions: QuizQuestion[];
  }) {
    setName(deck.name);
    setQuestions(deckToDraft({ id: deck.$id, name: deck.name, questions: deck.questions }));
  }

  function handleStart() {
    if (!valid) return;
    onStart(draftToDeck(name, questions));
  }

  async function handleSaveToCloud() {
    if (!valid) return;
    setSaveBusy(true);
    setSaveError(null);
    try {
      await auth.saveDeckToCloud(draftToDeck(name, questions));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save deck");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleGenerateWithAi() {
    const topic = aiTopic.trim();
    if (!topic || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    setAiDone(0);
    try {
      const result = await generateQuestions({
        topic,
        questionCount: aiQuestionCount,
        optionCount: aiOptionCount,
        language: aiLanguage,
      });
      const drafts = generatedQuestionsToDraft(result.questions);
      if (drafts.length === 0) {
        throw new Error("The AI returned no usable questions");
      }
      setName(topic);
      setQuestions(drafts);
      setAiDone(drafts.length);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Could not generate questions",
      );
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="deck-name"
          className="text-xs font-medium uppercase tracking-wider text-fg-muted"
        >
          Quiz name
        </label>
        <Input
          id="deck-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. General knowledge"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-4">
        <button
          type="button"
          onClick={() => setAiOpen((open) => !open)}
          className="flex min-h-[44px] w-full items-center justify-between text-left text-sm font-medium text-fg-secondary"
        >
          <span>✨ Generate questions with AI</span>
          <span className="text-fg-muted">{aiOpen ? "−" : "+"}</span>
        </button>
        <AnimatePresence initial={false}>
          {aiOpen ? (
            <motion.div
              className="flex flex-col gap-3 pt-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="ai-topic"
                  className="text-xs text-fg-muted"
                >
                  Topic or type of question
                </label>
                <Input
                  id="ai-topic"
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                  placeholder="e.g. Space exploration"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="ai-count"
                    className="text-xs text-fg-muted"
                  >
                    Question amount
                  </label>
                  <Input
                    id="ai-count"
                    type="number"
                    min={1}
                    max={20}
                    value={aiQuestionCount}
                    onChange={(event) =>
                      setAiQuestionCount(Number(event.target.value))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="ai-option-count"
                    className="text-xs text-fg-muted"
                  >
                    Choice amount
                  </label>
                  <Input
                    id="ai-option-count"
                    type="number"
                    min={MIN_DRAFT_OPTIONS}
                    max={MAX_DRAFT_OPTIONS}
                    value={aiOptionCount}
                    onChange={(event) =>
                      setAiOptionCount(Number(event.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="ai-language"
                  className="text-xs text-fg-muted"
                >
                  Language
                </label>
                <select
                  id="ai-language"
                  value={aiLanguage}
                  onChange={(event) =>
                    setAiLanguage(
                      event.target.value as (typeof GENERATION_LANGUAGES)[number],
                    )
                  }
                  className="min-h-[48px] rounded-2xl border border-line bg-surface px-4 text-sm text-fg-secondary outline-none ring-primary/40 focus:ring-2"
                >
                  {GENERATION_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                onClick={() => void handleGenerateWithAi()}
                disabled={!aiTopic.trim() || aiBusy}
                className="w-full"
              >
                {aiBusy ? "Generating…" : "Generate questions"}
              </Button>
              {aiError ? (
                <p className="text-center text-xs text-danger">{aiError}</p>
              ) : null}
              {aiDone > 0 ? (
                <p className="text-center text-xs text-success">
                  Generated {aiDone} questions — they replaced your current
                  deck. Review and edit them below.
                </p>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg-secondary">
            Questions ({questions.length})
          </h2>
          <Button type="button" variant="ghost" onClick={addQuestion}>
            Add question
          </Button>
        </div>

        {questions.map((question, index) => (
          <motion.section
            key={question.id}
            className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-text">
                Question {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="min-h-[40px] min-w-[40px] rounded-full px-2 text-xs text-danger transition-transform active:scale-[0.96]"
              >
                Remove
              </button>
            </div>

            <Input
              value={question.prompt}
              onChange={(event) =>
                updateQuestion(index, { prompt: event.target.value })
              }
              placeholder="Type the question…"
            />

            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const color = optionColorAt(optionIndex);
                const isCorrect = option.id === question.correctOptionId;
                return (
                  <div key={option.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(index, { correctOptionId: option.id })
                      }
                      aria-label={
                        isCorrect
                          ? "Correct answer"
                          : "Mark as correct answer"
                      }
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-zinc-950 transition-transform active:scale-[0.96] ${color.bar} ${
                        isCorrect
                          ? "ring-2 ring-fg"
                          : "opacity-50 hover:opacity-80"
                      }`}
                    >
                      {isCorrect ? "✓" : optionLetter(optionIndex)}
                    </button>
                    <Input
                      value={option.text}
                      onChange={(event) =>
                        updateOption(index, option.id, event.target.value)
                      }
                      placeholder={`Option ${optionLetter(optionIndex)}`}
                      className="min-h-[40px]"
                    />
                    {question.options.length > MIN_DRAFT_OPTIONS ? (
                      <button
                        type="button"
                        onClick={() => removeOption(index, option.id)}
                        aria-label="Remove option"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-fg-muted transition-transform active:scale-[0.96]"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                onClick={() => addOption(index)}
                disabled={question.options.length >= MAX_DRAFT_OPTIONS}
                className="self-start"
              >
                Add option
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`time-${question.id}`}
                className="text-xs text-fg-muted"
              >
                Time limit
              </label>
              <select
                id={`time-${question.id}`}
                value={question.timeLimitMs}
                onChange={(event) =>
                  updateQuestion(index, {
                    timeLimitMs: Number(event.target.value),
                  })
                }
                className="min-h-[40px] rounded-xl border border-line bg-surface px-3 text-sm text-fg-secondary outline-none ring-primary/40 focus:ring-2"
              >
                {TIME_LIMITS_MS.map((ms) => (
                  <option key={ms} value={ms}>
                    {ms / 1000}s
                  </option>
                ))}
              </select>
            </div>
          </motion.section>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={handleStart}
          disabled={!valid}
          className="w-full"
        >
          Start quiz
        </Button>
        {!valid ? (
          <p className="text-center text-xs text-fg-muted">
            Each question needs a prompt and at least two options with one
            marked correct.
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-line bg-surface p-4">
        <button
          type="button"
          onClick={() => setAuthOpen((open) => !open)}
          className="flex min-h-[44px] w-full items-center justify-between text-left text-sm font-medium text-fg-secondary"
        >
          <span>My saved decks</span>
          <span className="text-fg-muted">{authOpen ? "−" : "+"}</span>
        </button>
        <AnimatePresence initial={false}>
          {authOpen ? (
            <motion.div
              className="flex flex-col gap-4 pt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {!auth.user ? (
                <AuthForm onLogin={auth.login} onRegister={auth.register} />
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-fg-secondary">
                      Signed in as <span className="text-fg">{auth.user.name || auth.user.email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => void auth.logout()}
                      className="min-h-[40px] rounded-full px-3 text-xs text-fg-muted transition-transform active:scale-[0.96]"
                    >
                      Log out
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleSaveToCloud()}
                    disabled={!valid || saveBusy}
                  >
                    {saveBusy ? "Saving…" : "Save this deck to my account"}
                  </Button>
                  {saveError ? (
                    <p className="text-center text-xs text-danger">
                      {saveError}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">
                      Saved decks
                    </p>
                    {auth.savedDecks.length === 0 ? (
                      <p className="text-xs text-fg-muted">
                        Nothing saved yet.
                      </p>
                    ) : (
                      auth.savedDecks.map((deck) => (
                        <div
                          key={deck.$id}
                          className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-fg-secondary">
                              {deck.name}
                            </p>
                            <p className="text-xs tabular-nums text-fg-muted">
                              {deck.questions.length} questions
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => loadDeckIntoEditor(deck)}
                            className="min-h-[40px] rounded-full px-3 text-xs font-medium text-primary-text transition-transform active:scale-[0.96]"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => void auth.deleteDeckFromCloud(deck.$id)}
                            aria-label={`Delete ${deck.name}`}
                            className="min-h-[40px] min-w-[40px] rounded-full text-fg-muted transition-transform active:scale-[0.96]"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
        <p className="text-xs text-fg-muted">
          Start over on this device: wipes the local deck and gives you a fresh
          room code.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            void confirmDialog({
              title: "Clear session?",
              message:
                "The deck will be cleared and you will start a fresh room.",
              confirmLabel: "Clear",
              tone: "danger",
            }).then((confirmed) => {
              if (confirmed) onClearSession();
            });
          }}
          className="w-full border-rose-500/30 text-danger"
        >
          Clear session
        </Button>
      </div>
    </div>
  );
}