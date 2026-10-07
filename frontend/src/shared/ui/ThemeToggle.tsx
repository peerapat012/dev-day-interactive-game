"use client";

import { useThemeStore } from "@/shared/theme/themeStore";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-lg text-fg-secondary active:bg-surface-hover"
    >
      <span aria-hidden>{isDark ? "☀" : "☾"}</span>
    </button>
  );
}
