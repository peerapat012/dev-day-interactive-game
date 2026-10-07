import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", children, ...props },
  ref,
) {
  const base =
    "inline-flex min-h-[48px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-fg active:bg-primary/90 shadow-lg shadow-primary/20"
      : variant === "danger"
        ? "bg-danger text-white active:bg-danger/90 shadow-lg shadow-danger/20"
        : "bg-surface text-fg-secondary active:bg-surface-hover border border-line";

  return (
    <button ref={ref} className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
});
