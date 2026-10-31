"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

const GROUPS: { title: string; items: { href: string; label: string; icon: string }[] }[] = [
  { title: "Business", items: [
    { href: "/admin", label: "Overview", icon: "◎" },
    { href: "/admin/users", label: "Users", icon: "☺" },
    { href: "/admin/packages", label: "Packages", icon: "₹" },
    { href: "/admin/orders", label: "Orders & payments", icon: "▤" },
  ] },
  { title: "Content", items: [
    { href: "/admin/templates", label: "Templates", icon: "❖" },
    { href: "/admin/home", label: "Home page", icon: "⌂" },
    { href: "/admin/faqs", label: "FAQs", icon: "?" },
  ] },
  { title: "Operations", items: [
    { href: "/admin/sites", label: "Wedding sites", icon: "◉" },
    { href: "/admin/media", label: "Media & storage", icon: "▣" },
    { href: "/admin/activity", label: "Activity log", icon: "≡" },
    { href: "/admin/settings", label: "Settings", icon: "⚙" },
  ] },
];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

/**
 * The admin panel's menu: a sidebar on wide screens, a scrollable row of tabs on phones. The current section
 * (and its sub-pages, e.g. a user's details under Users) is highlighted and marked aria-current.
 */
export function AdminNav() {
  const pathname = usePathname();
  const row = useRef<HTMLElement>(null);
  // Phones: keep the current section's tab in view in the sideways-scrolling row.
  useEffect(() => {
    const el = row.current, tab = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && tab) el.scrollLeft = tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2;
  }, [pathname]);
  const all = GROUPS.flatMap((g) => g.items);
  return (
    <>
      <nav aria-label="Admin" className="hidden lg:block">
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const on = isActive(pathname, i.href);
                return (
                  <li key={i.href}>
                    <Link href={i.href} aria-current={on ? "page" : undefined}
                      className={cn("flex items-center gap-2.5 rounded-xl border-l-[3px] px-3 py-2 text-sm transition-colors",
                        on ? "border-pink-dark bg-tint font-semibold text-pink-deep" : "border-transparent text-ink hover:bg-blush")}>
                      <span aria-hidden="true" className="grid size-6 place-items-center rounded-lg bg-white text-xs shadow-[0_0_0_1px_var(--color-line)]">{i.icon}</span>
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <nav ref={row} aria-label="Admin sections" className="relative scroll-row -mx-4 border-b border-line px-4 lg:hidden">
        <ul className="flex min-w-max gap-1">
          {all.map((i) => {
            const on = isActive(pathname, i.href);
            return (
              <li key={i.href}>
                <Link href={i.href} aria-current={on ? "page" : undefined}
                  className={cn("block whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium",
                    on ? "border-pink-dark font-semibold text-pink-deep" : "border-transparent text-mute hover:text-ink")}>
                  {i.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
