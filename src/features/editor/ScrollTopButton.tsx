"use client";

import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * A round "↑" button that appears once you've scrolled well down and brings you back to the top, of the page or
 * of a scrolling panel (`target`).
 */
export function ScrollTopButton({ target, label, className, after = 600 }: {
  target?: RefObject<HTMLElement | null>; label: string; className?: string; after?: number;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = target?.current ?? null;
    const source: HTMLElement | Window = el ?? window;
    const read = () => setShown((el ? el.scrollTop : window.scrollY) > after);
    source.addEventListener("scroll", read, { passive: true });
    return () => source.removeEventListener("scroll", read);
  }, [target, after]);
  const up = () => {
    const behavior: ScrollBehavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (target?.current) target.current.scrollTo({ top: 0, behavior }); else window.scrollTo({ top: 0, behavior });
  };
  return (
    <div className={cn("pointer-events-none flex justify-end transition-opacity", shown ? "opacity-100" : "opacity-0", className)} aria-hidden={!shown}>
      <button type="button" onClick={up} tabIndex={shown ? 0 : -1} aria-label={label} title={label}
        className={cn("grid size-11 place-items-center rounded-full border border-line bg-white text-lg font-semibold text-pink-dark shadow-[var(--shadow-soft)] hover:bg-tint", shown && "pointer-events-auto")}>
        ↑
      </button>
    </div>
  );
}
