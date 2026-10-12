import type { ReactNode } from "react";

/** Titled list of described actions; `danger` tone groups destructive ones. */
export function ActionGroup({
  title,
  tone = "default",
  children,
}: {
  title: string;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  const danger = tone === "danger";
  return (
    <section className="flex flex-col gap-2">
      <h2
        className={`px-1 text-sm font-semibold ${danger ? "text-danger" : "text-fg-secondary"}`}
      >
        {title}
      </h2>
      <div
        className={`flex flex-col divide-y rounded-2xl border ${
          danger
            ? "divide-danger/15 border-danger/25 bg-danger-soft"
            : "divide-line border-line bg-surface"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

export function ActionRow({
  description,
  children,
}: {
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
      <p className="flex-1 text-pretty text-sm leading-relaxed text-fg-secondary">
        {description}
      </p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
