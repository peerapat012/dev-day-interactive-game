import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full min-h-[48px] rounded-2xl border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-muted outline-none ring-primary/40 focus:ring-2 sm:text-sm ${className}`}
      {...props}
    />
  );
}
