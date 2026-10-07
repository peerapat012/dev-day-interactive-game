export const QUIZ_OPTION_COLORS = [
  { bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-400/70" },
  { bar: "bg-sky-500", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-400/70" },
  { bar: "bg-amber-400", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-300/70" },
  { bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-400/70" },
] as const;

export function optionColorAt(index: number) {
  return QUIZ_OPTION_COLORS[index % QUIZ_OPTION_COLORS.length];
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
