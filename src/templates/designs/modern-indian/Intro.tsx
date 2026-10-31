"use client";

import { useEffect, useState } from "react";
import { useBrowserValue } from "@/lib/utils/client";
import { announceInviteOpened, rememberIntro, seenIntro } from "../shared/events";

/**
 * The opening: a wax-sealed envelope. Breaking the seal opens the flap, the card rises out and the page appears
 * (music, if any, starts with that tap). "Skip" opens it at once. Returning guests (same tab) skip it.
 * The page wrapper gets "ready" when it's done, which runs the hero's entrance and lowers the garland.
 */
export function Envelope({ pageId, storageKey, kicker, names, joiner, date, monogram }: {
  pageId: string; storageKey: string | null; kicker: string | null; names: [string, string]; joiner: string; date: string | null; monogram: string;
}) {
  const [stage, setStage] = useState(0); // 0 closed · 1 seal broken · 2 flap open · 3 card out · 4 fading · 5 gone
  const seen = useBrowserValue(() => seenIntro(storageKey), false);

  useEffect(() => {
    const page = document.getElementById(pageId);
    if (seen) { page?.classList.add("ready"); return; }
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    page?.setAttribute("inert", "");
    return () => { html.style.overflow = previous; page?.removeAttribute("inert"); };
  }, [pageId, seen]);

  const finish = () => {
    const page = document.getElementById(pageId);
    rememberIntro(storageKey);
    document.documentElement.style.overflow = "";
    page?.removeAttribute("inert");
    page?.classList.add("ready");
    page?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    setTimeout(() => setStage(5), 1000);
  };

  const open = () => {
    if (stage) return;
    announceInviteOpened();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setStage(4); finish(); return; }
    setStage(1);
    setTimeout(() => setStage(2), 420);
    setTimeout(() => setStage(3), 1150);
    setTimeout(() => { setStage(4); finish(); }, 2500);
  };

  const skip = () => { if (stage) return; announceInviteOpened(); setStage(4); finish(); };

  if (seen || stage === 5) return null;
  const cls = ["intro", stage >= 1 && "s1", stage >= 2 && "s2", stage >= 3 && "s3", stage >= 4 && "s4"].filter(Boolean).join(" ");
  return (
    <div className={cls} role="dialog" aria-modal="true" aria-label="Open the invitation" data-olava-intro="">
      <div className="intro-glow" aria-hidden="true" />
      <div className="envelope">
        <div className="env-back" />
        <div className="env-card" aria-hidden="true">
          {kicker ? <p className="mono-label">{kicker}</p> : null}
          <p className="env-names">{names[0]}<br /><em>{joiner}</em>{names[1]}</p>
          {date ? <p className="env-date">{date}</p> : null}
        </div>
        <svg className="env-front" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
          <path className="env-pocket" d="M0 0 L150 124 L300 0 V200 H0Z" />
          <path className="env-fold" d="M0 0 L150 124 L300 0" />
          <path className="env-fold" d="M0 200 L128 112 M300 200 L172 112" />
        </svg>
        <div className="env-flap"><div className="env-flap-in" /></div>
        <button type="button" className="seal" aria-label={`${monogram}: break the seal to open the invitation`} onClick={open}>
          <span className="seal-half seal-l" />
          <span className="seal-half seal-r" />
          <span className="seal-ring" />
          <span className="seal-mono" aria-hidden="true"><span>{monogram}</span></span>
        </button>
      </div>
      <p className="intro-hint" aria-hidden="true">Tap the seal</p>
      <button type="button" className="intro-skip" onClick={skip}>Skip</button>
    </div>
  );
}
