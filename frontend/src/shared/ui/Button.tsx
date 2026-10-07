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
    "inline-flex min-h-[48px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-fg active:bg-primary/90 shadow-lg shadow-primary/20"
      : "bg-surface text-fg-secondary active:bg-surface-hover border border-line";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
