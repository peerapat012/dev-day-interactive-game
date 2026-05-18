import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex min-h-[48px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  const styles =
    variant === "primary"
      ? "bg-violet-500 text-white active:bg-violet-400 shadow-lg shadow-violet-500/20"
      : "bg-white/5 text-zinc-200 active:bg-white/10 border border-white/10";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
