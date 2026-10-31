"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useActiveNav, type NavItem } from "../nav/useActiveNav";

/** The public site's menu (wide screens): the current page or section is underlined in the accent colour. */
export function MainNav({ links }: { links: NavItem[] }) {
  const { active, ariaCurrent } = useActiveNav(links);
  return (
    <nav aria-label="Main" className="hidden gap-7 lg:flex">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={ariaCurrent(l.href)} data-active={active === l.href || undefined}
          className={cn("relative py-1 text-[15px] font-medium transition-colors hover:text-pink-dark",
            "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-pink-dark after:transition-transform after:duration-300",
            active === l.href ? "text-pink-dark after:scale-x-100" : "text-ink after:scale-x-0")}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
