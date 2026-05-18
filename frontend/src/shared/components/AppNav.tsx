import Link from "next/link";
import { GAME_NAV } from "@/lib/gameNav";

export function AppNav() {
  return (
    <nav className="hidden flex-wrap items-center gap-2 md:flex">
      {GAME_NAV.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
