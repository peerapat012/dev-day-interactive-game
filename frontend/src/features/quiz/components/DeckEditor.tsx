"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import {
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  PlusIcon,
  SparkleIcon,
} from "@/shared/ui/icons";
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
  /** Extra sidebar content below the deck tools (room/session actions). */
  aside?: ReactNode;
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

export function DeckEditor({ initialDeck, onStart, aside, auth }: DeckEditorProps) {
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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="deck-name" className="px-1 text-sm font-semibold text-fg-secondary">
            Quiz name
          </label>
          <Input
            id="deck-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. General knowledge"
            className="text-lg font-semibold sm:text-base"
          />
        </div>

        <div className="flex items-baseline justify-between gap-2 px-1 pt-2">
          <h2 className="text-sm font-semibold text-fg-secondary">Questions</h2>
          <span className="text-xs tabular-nums text-fg-muted">
            {questions.length} {questions.length === 1 ? "question" : "questions"}
          </span>
        </div>

        {questions.map((question, index) => (
          <motion.section
            key={question.id}
            aria-label={`Question ${index + 1}`}
            className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 sm:p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-xs font-bold tabular-nums text-primary-text">
                {index + 1}
              </span>
              <Input
                value={question.prompt}
                onChange={(event) =>
                  updateQuestion(index, { prompt: event.target.value })
                }
                placeholder="Type the question…"
                aria-label={`Question ${index + 1} prompt`}
                className="min-w-0 flex-1 font-medium"
              />
            </div>

            <div className="flex flex-col gap-2 sm:pl-11">
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
                      aria-pressed={isCorrect}
                      className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-zinc-950 transition-[transform,opacity] active:scale-[0.96] ${color.bar} ${
                        isCorrect
                          ? "ring-2 ring-fg ring-offset-2 ring-offset-background"
                          : "opacity-50 hover:opacity-80"
                      }`}
                    >
                      {isCorrect ? <CheckIcon className="size-4" strokeWidth={2.5} /> : optionLetter(optionIndex)}
                    </button>
                    <Input
                      value={option.text}
                      onChange={(event) =>
                        updateOption(index, option.id, event.target.value)
                      }
                      placeholder={`Option ${optionLetter(optionIndex)}`}
                      className="min-h-[40px] min-w-0 flex-1"
                    />
                    {question.options.length > MIN_DRAFT_OPTIONS ? (
                      <button
                        type="button"
                        onClick={() => removeOption(index, option.id)}
                        aria-label={`Remove option ${optionLetter(optionIndex)}`}
                        className="grid size-10 shrink-0 place-items-center rounded-full text-fg-muted transition-[transform,color] hover:text-danger active:scale-[0.96]"
                      >
                        <CloseIcon />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 sm:pl-11">
              <Button
                type="button"
                variant="ghost"
                onClick={() => addOption(index)}
                disabled={question.options.length >= MAX_DRAFT_OPTIONS}
                className="min-h-10 gap-1.5 px-4 py-1.5"
              >
                <PlusIcon />
                Add option
              </Button>
              <label
                htmlFor={`time-${question.id}`}
                className="ml-auto text-xs text-fg-muted"
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
                className="min-h-10 rounded-xl border border-line bg-surface px-3 text-sm tabular-nums text-fg-secondary outline-none ring-primary/40 focus:ring-2"
              >
                {TIME_LIMITS_MS.map((ms) => (
                  <option key={ms} value={ms}>
                    {ms / 1000}s
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="min-h-10 rounded-full px-3 text-xs font-medium text-danger transition-transform active:scale-[0.96]"
              >
                Remove
              </button>
            </div>
          </motion.section>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="flex min-h-14 items-center justify-center gap-2 rounded-3xl border border-dashed border-line-strong text-sm font-medium text-fg-secondary transition-[transform,background-color] hover:bg-surface active:scale-[0.99]"
        >
          <PlusIcon />
          Add question
        </button>
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:static lg:z-auto lg:rounded-3xl lg:border lg:bg-surface lg:p-5 lg:backdrop-blur-none">
          <div className="mx-auto flex max-w-lg flex-col gap-2 lg:max-w-none">
            <p className="hidden text-sm text-fg-secondary lg:block">
              <span className="font-semibold text-fg">{name.trim() || "Untitled quiz"}</span>
              <span className="tabular-nums text-fg-muted">
                {" "}· {questions.length} {questions.length === 1 ? "question" : "questions"}
              </span>
            </p>
            <Button
              type="button"
              onClick={handleStart}
              disabled={!valid}
              className="w-full text-base font-semibold"
            >
              Start quiz
            </Button>
            {!valid ? (
              <p className="text-center text-xs text-fg-muted lg:text-left">
                Each question needs a prompt and at least two options with one
                marked correct.
              </p>
            ) : null}
          </div>
        </div>

        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
          <button
            type="button"
            onClick={() => setAiOpen((open) => !open)}
            aria-expanded={aiOpen}
            className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold text-fg"
          >
            <SparkleIcon className="size-4 text-primary-text" />
            <span className="flex-1">Generate questions with AI</span>
            <ChevronDownIcon
              className={`size-4 text-fg-muted transition-transform duration-200 ${aiOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {aiOpen ? (
              <motion.div
                className="flex flex-col gap-3 overflow-hidden pt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ai-topic" className="text-xs text-fg-muted">
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
                    <label htmlFor="ai-count" className="text-xs text-fg-muted">
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
                    <label htmlFor="ai-option-count" className="text-xs text-fg-muted">
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
                  <label htmlFor="ai-language" className="text-xs text-fg-muted">
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
                  <p className="text-center text-xs text-danger" role="alert">
                    {aiError}
                  </p>
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
        </section>

        <section className="rounded-3xl border border-line bg-surface p-4">
          <button
            type="button"
            onClick={() => setAuthOpen((open) => !open)}
            aria-expanded={authOpen}
            className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold text-fg"
          >
            <span className="flex-1">My saved decks</span>
            <ChevronDownIcon
              className={`size-4 text-fg-muted transition-transform duration-200 ${authOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {authOpen ? (
              <motion.div
                className="flex flex-col gap-4 overflow-hidden pt-3"
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
                      <p className="text-center text-xs text-danger" role="alert">
                        {saveError}
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-fg-muted">
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
                            className="flex items-center gap-2 rounded-2xl border border-line p-2.5"
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
                              className="grid size-10 place-items-center rounded-full text-fg-muted transition-[transform,color] hover:text-danger active:scale-[0.96]"
                            >
                              <CloseIcon />
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
        </section>

        {aside}
      </aside>
    </div>
  );
}
