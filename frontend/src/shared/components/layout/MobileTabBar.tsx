"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAME_NAV } from "@/lib/gameNav";

function CloudIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-6 w-6 ${active ? "text-violet-400" : "text-zinc-500"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
      />
    </svg>
  );
}

function SummaryIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-6 w-6 ${active ? "text-violet-400" : "text-zinc-500"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function QuizIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-6 w-6 ${active ? "text-violet-400" : "text-zinc-500"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

const ICON_BY_HREF: Record<
  (typeof GAME_NAV)[number]["href"],
  typeof CloudIcon
> = {
  "/host": CloudIcon,
  "/guest": SummaryIcon,
  "/quiz/host": QuizIcon,
};

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
        {GAME_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICON_BY_HREF[item.href] ?? CloudIcon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-[transform,background-color] active:scale-[0.96] ${
                  active
                    ? "bg-violet-500/15 text-violet-300"
                    : "text-zinc-400 active:bg-white/5"
                }`}
              >
                <Icon active={active} />
                <span className="text-[11px] font-medium leading-none">
                  {item.mobileLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
