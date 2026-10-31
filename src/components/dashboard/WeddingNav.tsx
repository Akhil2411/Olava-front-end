"use client";
import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { PendingLabel, TrackNavigation } from "@/components/loading/SectionLoading";

const TABS = [
  ["", "Overview"], ["/details", "Details"], ["/events", "Events"], ["/design", "Edit & design"],
  ["/gallery", "Gallery"], ["/guests", "Guests & RSVP"], ["/publish", "Publish & share"], ["/settings", "Settings"],
] as const;

/**
 * Section tabs. When the host shows intent (hover, touch, keyboard focus) the tab is prefetched in full, which
 * usually makes the section appear at once. Pending navigations drive the section loader (TrackNavigation),
 * and the tapped tab is highlighted straight away (PendingLabel).
 */
function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  const [intent, setIntent] = useState(false);
  const warm = () => setIntent(true);
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      prefetch={intent && !active ? true : null}
      onMouseEnter={warm} onTouchStart={warm} onFocus={warm}
      className={cn("block border-b-2 px-3 py-3 text-sm font-medium transition-colors",
        active ? "border-pink-dark text-pink-dark" : "border-transparent text-mute hover:text-ink")}>
      <PendingLabel>{children}</PendingLabel>
      <TrackNavigation />
    </Link>
  );
}

/**
 * The editor (Design tab) is the heaviest section to open the first time: its code (incl. drag-and-drop) is
 * only downloaded on navigation. Warm it up once the dashboard is idle, so opening Design doesn't wait for it.
 */
function useWarmEditorCode() {
  useEffect(() => {
    const warm = () => { void import("@/features/editor/SiteEditor"); };
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(warm, { timeout: 4000 }) : window.setTimeout(warm, 1500);
    return () => { if (idle) window.cancelIdleCallback(handle); else window.clearTimeout(handle); };
  }, []);
}

export function WeddingNav({ weddingId }: { weddingId: string }) {
  useWarmEditorCode();
  const pathname = usePathname();
  const base = `/dashboard/weddings/${weddingId}`;
  return (
    <nav aria-label="Wedding sections" className="scroll-row -mx-4 px-4 sm:mx-0 sm:px-0 sm:[mask-image:none]">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {TABS.map(([suffix, label]) => {
          const href = base + suffix;
          const active = suffix === "" ? pathname === base : pathname.startsWith(href);
          return <li key={suffix}><TabLink href={href} active={active}>{label}</TabLink></li>;
        })}
      </ul>
    </nav>
  );
}
