import Link from "next/link";
import { GAME_NAV } from "@/lib/gameNav";

export function AppNav() {
  return (
    <nav className="hidden flex-wrap items-center gap-2 md:flex">
      {GAME_NAV.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-fg-secondary transition-[background-color,border-color,color] duration-150 ease-out hover:border-primary/40 hover:bg-primary-soft hover:text-fg"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
