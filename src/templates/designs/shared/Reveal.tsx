"use client";

import { useEffect } from "react";

/**
 * Fades sections in as they scroll into view: adds "in" to every `.reveal` inside the design root.
 * Elements are only hidden when scripting is on (CSS), so content never disappears without JavaScript.
 */
export function RevealObserver({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    const watch = () => root.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    watch();
    // Sections can change while the page is open (client navigation): watch new ones too.
    const mo = new MutationObserver(watch);
    mo.observe(root, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [rootId]);
  return null;
}
