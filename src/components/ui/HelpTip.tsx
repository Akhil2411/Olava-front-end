"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * A small "?" button that explains something. Opens on hover and keyboard focus (desktop) and on tap (phones,
 * which have no hover); Escape or tapping elsewhere closes it. The text is announced through aria-describedby.
 * The tip floats above the page (fixed position, kept on screen, above the button when there's no room
 * below), so opening it never moves the layout or adds a scrollbar to a dialog.
 */
export function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const id = useId();
  const box = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btn.current?.getBoundingClientRect();
      if (!r) return;
      const vw = document.documentElement.clientWidth, vh = window.innerHeight;
      const width = Math.min(288, vw - 24);
      const h = tip.current?.offsetHeight ?? 120;
      const left = Math.max(12, Math.min(r.left + r.width / 2 - width / 2, vw - width - 12));
      const below = r.bottom + 8;
      const top = below + h > vh - 8 && r.top - 8 - h > 8 ? r.top - 8 - h : below;
      setPos({ left, top, width });
    };
    place();
    const raf = requestAnimationFrame(place); // again once the tip has its real height
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) { setOpen(false); setPinned(false); } };
    // Escape closes only the tip: caught first (capture) and stopped, so a dialog around it stays open.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault(); e.stopPropagation();
      setOpen(false); setPinned(false);
    };
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc, true);
    return () => { document.removeEventListener("pointerdown", away); window.removeEventListener("keydown", esc, true); };
  }, [open]);

  return (
    <span ref={box} className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (!pinned) setOpen(false); }}>
      <button ref={btn} type="button" aria-label={label} aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={() => { const next = !pinned; setPinned(next); setOpen(next); }}
        onFocus={() => setOpen(true)} onBlur={() => { if (!pinned) setOpen(false); }}
        className="grid size-6 place-items-center rounded-full border border-line bg-white text-xs font-bold text-pink-dark hover:bg-tint focus-visible:outline-2 focus-visible:outline-pink-dark">
        ?
      </button>
      {open ? (
        <span id={id} ref={tip} role="tooltip" style={pos ? { left: pos.left, top: pos.top, width: pos.width } : { left: 0, top: 0, visibility: "hidden" }}
          className="fixed z-[60] block rounded-2xl border border-line bg-white p-4 text-left text-xs font-normal leading-relaxed text-ink shadow-[var(--shadow-soft)]">
          {children}
        </span>
      ) : null}
    </span>
  );
}
