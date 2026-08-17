"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { optionColorAt, optionLetter } from "@/features/quiz/components/quizOptionStyles";
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

interface DraftOption {
  id: string;
  text: string;
}

interface DraftQuestion {
  id: string;
  prompt: string;
  options: DraftOption[];
  correctOptionId: string;
  timeLimitMs: number;
}

const TIME_LIMITS_MS = [10000, 20000, 30000, 60000];

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyQuestion(): DraftQuestion {
  const options = [0, 1].map(() => ({ id: uid(), text: "" }));
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

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

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

  function removeOption(questionIndex: number, optionId: string) {    setQuestions((prev) =>
      prev.map((question, i) => {
        if (i !== questionIndex) return question;
        const options = question.options.filter((o) => o.id !== optionId);
        const stillValid = options.some(
          (o) => o.id === question.correctOptionId,
        );
        return {
          ...question,
          options,
          correctOptionId: stillValid
            ? question.correctOptionId
            : (options[0]?.id ?? ""),
        };
      }),
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
    setAuthBusy(true);
    setAuthError(null);
    try {
      await auth.saveDeckToCloud(draftToDeck(name, questions));
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Could not save deck",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogin() {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await auth.login(loginEmail, loginPassword);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Could not log in",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleRegister() {
    if (regPassword.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      await auth.register(regName, regEmail, regPassword);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Could not create account",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="deck-name"
          className="text-xs font-medium uppercase tracking-wider text-zinc-500"
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

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">
            Questions ({questions.length})
          </h2>
          <Button type="button" variant="ghost" onClick={addQuestion}>
            Add question
          </Button>
        </div>

        {questions.map((question, index) => (
          <motion.section
            key={question.id}
            className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Question {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="min-h-[40px] min-w-[40px] rounded-full px-2 text-xs text-rose-400 transition-transform active:scale-[0.96]"
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
                          ? "ring-2 ring-white/80"
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
                    {question.options.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => removeOption(index, option.id)}
                        aria-label="Remove option"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-500 transition-transform active:scale-[0.96]"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`time-${question.id}`}
                className="text-xs text-zinc-400"
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
                className="min-h-[40px] rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none ring-violet-500/40 focus:ring-2"
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
          <p className="text-center text-xs text-zinc-500">
            Each question needs a prompt and at least two options with one
            marked correct.
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
        <button
          type="button"
          onClick={() => setAuthOpen((open) => !open)}
          className="flex min-h-[44px] w-full items-center justify-between text-left text-sm font-medium text-zinc-200"
        >
          <span>My saved decks</span>
          <span className="text-zinc-500">{authOpen ? "−" : "+"}</span>
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
                <div className="flex flex-col gap-3">
                  <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                    {(["login", "register"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setAuthMode(mode);
                          setAuthError(null);
                        }}
                        className={`relative flex-1 rounded-full py-2 text-xs font-medium transition-transform active:scale-[0.96] ${
                          authMode === mode ? "text-white" : "text-zinc-400"
                        }`}
                      >
                        {authMode === mode ? (
                          <motion.span
                            layoutId="auth-mode-pill"
                            className="absolute inset-0 rounded-full bg-violet-500/80"
                            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                          />
                        ) : null}
                        <span className="relative capitalize">{mode}</span>
                      </button>
                    ))}
                  </div>

                  {authMode === "register" ? (
                    <Input
                      value={regName}
                      onChange={(event) => setRegName(event.target.value)}
                      placeholder="Name"
                    />
                  ) : null}
                  <Input
                    type="email"
                    value={authMode === "login" ? loginEmail : regEmail}
                    onChange={(event) =>
                      authMode === "login"
                        ? setLoginEmail(event.target.value)
                        : setRegEmail(event.target.value)
                    }
                    placeholder="Email"
                    autoComplete="email"
                  />
                  <Input
                    type="password"
                    value={authMode === "login" ? loginPassword : regPassword}
                    onChange={(event) =>
                      authMode === "login"
                        ? setLoginPassword(event.target.value)
                        : setRegPassword(event.target.value)
                    }
                    placeholder="Password"
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                  />
                  <Button
                    type="button"
                    onClick={
                      authMode === "login" ? handleLogin : handleRegister
                    }
                    disabled={authBusy}
                  >
                    {authBusy
                      ? "Please wait…"
                      : authMode === "login"
                        ? "Log in"
                        : "Create account"}
                  </Button>
                  {authError ? (
                    <p className="text-center text-xs text-rose-400">
                      {authError}
                    </p>
                  ) : null}
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Logging in lets you save decks to your account and reuse
                    them across devices. Without an account, your deck stays on
                    this device.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-zinc-300">
                      Signed in as <span className="text-zinc-100">{auth.user.name || auth.user.email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => void auth.logout()}
                      className="min-h-[40px] rounded-full px-3 text-xs text-zinc-400 transition-transform active:scale-[0.96]"
                    >
                      Log out
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleSaveToCloud()}
                    disabled={!valid || authBusy}
                  >
                    {authBusy ? "Saving…" : "Save this deck to my account"}
                  </Button>
                  {authError ? (
                    <p className="text-center text-xs text-rose-400">
                      {authError}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Saved decks
                    </p>
                    {auth.savedDecks.length === 0 ? (
                      <p className="text-xs text-zinc-500">
                        Nothing saved yet.
                      </p>
                    ) : (
                      auth.savedDecks.map((deck) => (
                        <div
                          key={deck.$id}
                          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-zinc-200">
                              {deck.name}
                            </p>
                            <p className="text-xs tabular-nums text-zinc-500">
                              {deck.questions.length} questions
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => loadDeckIntoEditor(deck)}
                            className="min-h-[40px] rounded-full px-3 text-xs font-medium text-violet-300 transition-transform active:scale-[0.96]"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => void auth.deleteDeckFromCloud(deck.$id)}
                            aria-label={`Delete ${deck.name}`}
                            className="min-h-[40px] min-w-[40px] rounded-full text-zinc-500 transition-transform active:scale-[0.96]"
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
        <p className="text-xs text-zinc-400">
          Start over on this device: wipes the local deck and gives you a fresh
          room code.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (window.confirm("Clear the deck and start a fresh room?")) {
              onClearSession();
            }
          }}
          className="w-full border-rose-500/30 text-rose-300"
        >
          Clear session
        </Button>
      </div>
    </div>
  );
}