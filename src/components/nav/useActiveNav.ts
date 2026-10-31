"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export interface NavItem { href: string; label: string }

/** The section of the home page that's on screen, from the links' "#id"s (scroll spy). */
function useScrollSpy(ids: string[], enabled: boolean): string | null {
  const [current, setCurrent] = useState<string | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!enabled) return;
    const targets = key.split(",").map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (targets.length === 0) return;
    const pick = () => {
      // The last section whose top has passed the upper third of the screen (the one being read).
      const line = window.innerHeight * 0.35;
      let found: string | null = null;
      for (const t of targets) if (t.getBoundingClientRect().top <= line) found = t.id;
      // Nothing yet (the hero), or scrolled past the last section into the footer: keep the last one.
      const last = targets[targets.length - 1];
      if (found === last.id && last.getBoundingClientRect().bottom < 0) found = null;
      setCurrent(found);
    };
    pick();
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); window.removeEventListener("hashchange", onScroll); };
  }, [key, enabled]);
  return enabled ? current : null;
}

/**
 * Which menu link is current: a page link ("/templates") when you're on that page or one under it, or, on the
 * home page, the "/#section" link of the section you're reading. `aria-current` is "page" for a page and
 * "location" for a section of the page.
 */
export function useActiveNav(items: NavItem[]): { active: string | null; ariaCurrent: (href: string) => "page" | "location" | undefined } {
  const pathname = usePathname();
  const sections = items.filter((i) => i.href.startsWith("/#")).map((i) => i.href.slice(2));
  const spied = useScrollSpy(sections, pathname === "/");
  let active: string | null = null;
  if (pathname === "/" && spied) active = `/#${spied}`;
  else {
    const page = items.filter((i) => !i.href.includes("#"))
      .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (page) active = page.href;
  }
  return { active, ariaCurrent: (href) => (href !== active ? undefined : href.includes("#") ? "location" : "page") };
}
