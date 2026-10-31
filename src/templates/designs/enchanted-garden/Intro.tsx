"use client";

import { useEffect, useState } from "react";
import { useBrowserValue } from "@/lib/utils/client";
import { announceInviteOpened, rememberIntro, seenIntro } from "../shared/events";
import { badgeOuter, badgeInner } from "./art";

/**
 * The opening: two doors with a "Tap to open" badge. Tapping swings the doors open, the curtains behind part and
 * the names appear; music (if any) starts with the tap. Returning guests (same tab) skip it.
 */
export function Intro({ heroId, pageId, storageKey, label }: { heroId: string; pageId: string; storageKey: string | null; label: string }) {
  const [stage, setStage] = useState<"closed" | "open" | "done" | "gone">("closed");
  const seen = useBrowserValue(() => seenIntro(storageKey), false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const page = document.getElementById(pageId);
    if (seen) {
      hero?.classList.add("opened");
      return;
    }
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    page?.setAttribute("inert", "");
    return () => { html.style.overflow = previous; page?.removeAttribute("inert"); };
  }, [heroId, pageId, seen]);

  const open = () => {
    if (stage !== "closed") return;
    announceInviteOpened();
    setStage("open");
    const hero = document.getElementById(heroId);
    const page = document.getElementById(pageId);
    setTimeout(() => hero?.classList.add("opened"), 950);
    setTimeout(() => setStage("done"), 1700);
    setTimeout(() => {
      rememberIntro(storageKey); // after the animation: remembering earlier would hide the doors mid-swing
      setStage("gone");
      document.documentElement.style.overflow = "";
      page?.removeAttribute("inert");
      page?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    }, 2300);
  };

  if (stage === "gone" || seen) return null;
  return (
    <div className={`intro${stage !== "closed" ? " open" : ""}${stage === "done" ? " done" : ""}`} onClick={open} data-olava-intro="">
      <div className="door door-left"><svg className="door-art" aria-hidden="true"><rect width="100%" height="100%" fill="url(#eg-leaf-pattern)" /></svg></div>
      <div className="door door-right"><svg className="door-art" aria-hidden="true"><rect width="100%" height="100%" fill="url(#eg-leaf-pattern)" /></svg></div>
      <button type="button" className="badge" aria-label={label} onClick={(e) => { e.stopPropagation(); open(); }}>
        <svg viewBox="0 0 200 180" className="badge-svg" aria-hidden="true">
          <path className="badge-outer" d={badgeOuter} />
          <path className="badge-inner" d={badgeInner} />
          <use href="#eg-sprig-small" transform="translate(100 52)" />
          <text x="100" y="98" textAnchor="middle" className="badge-text">{label.toUpperCase()}</text>
          <use href="#eg-sprig-small" transform="translate(100 128) rotate(180)" />
        </svg>
      </button>
    </div>
  );
}
