"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  helperText?: string;
}

const DEFAULT_HELPER_TEXT =
  "Logging in lets you save decks to your account and reuse them across devices. Without an account, your deck stays on this device.";

export function AuthForm({
  onLogin,
  onRegister,
  helperText = DEFAULT_HELPER_TEXT,
}: AuthFormProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  async function handleLogin() {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await onLogin(loginEmail, loginPassword);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not log in");
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
      await onRegister(regName, regEmail, regPassword);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Could not create account",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  return (
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
        autoComplete={authMode === "login" ? "current-password" : "new-password"}
      />
      <Button
        type="button"
        onClick={authMode === "login" ? handleLogin : handleRegister}
        disabled={authBusy}
      >
        {authBusy
          ? "Please wait…"
          : authMode === "login"
            ? "Log in"
            : "Create account"}
      </Button>
      {authError ? (
        <p className="text-center text-xs text-rose-400">{authError}</p>
      ) : null}
      <p className="text-xs leading-relaxed text-zinc-500">{helperText}</p>
    </div>
  );
}
