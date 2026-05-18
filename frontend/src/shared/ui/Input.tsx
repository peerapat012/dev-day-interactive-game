import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full min-h-[48px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 outline-none ring-violet-500/40 focus:ring-2 sm:text-sm ${className}`}
      {...props}
    />
  );
}
