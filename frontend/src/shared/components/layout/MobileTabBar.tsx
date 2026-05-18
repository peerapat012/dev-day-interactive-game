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

function GroupsIcon({ active }: { active: boolean }) {
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
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
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

const ICONS = [CloudIcon, GroupsIcon, SummaryIcon];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
        {GAME_NAV.map((item, index) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = ICONS[index] ?? CloudIcon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition active:scale-95 ${
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
