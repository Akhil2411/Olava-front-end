"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useActiveNav } from "../nav/useActiveNav";

export function MobileMenu({ links, account }: { links: { href: string; label: string }[]; account: { href: string; label: string } | null }) {
  const [open, setOpen] = useState(false);
  const { active, ariaCurrent } = useActiveNav(links);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="rounded-full p-2 text-2xl leading-none text-ink"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "×" : "☰"}
      </button>
      {open ? (
        <nav id="mobile-menu" aria-label="Mobile" className="absolute inset-x-0 top-[68px] flex flex-col border-b border-line bg-blush px-5 pb-5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} aria-current={ariaCurrent(l.href)}
              className={cn("-mx-5 border-b border-line border-l-[3px] px-5 py-3 font-medium",
                active === l.href ? "border-l-pink-dark bg-tint/70 font-semibold text-pink-deep" : "border-l-transparent")}>
              {l.label}
            </Link>
          ))}
          <Link href={account?.href ?? "/login"} onClick={() => setOpen(false)} className="py-3 font-semibold text-pink-dark">
            {account?.label ?? "Sign in / Register"}
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
