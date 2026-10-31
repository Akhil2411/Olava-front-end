"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface CalendarEvent {
  title: string;
  /** ISO instants. */
  start: string;
  end: string | null;
  location: string | null;
  description?: string | null;
}

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

/** A standard .ics file (works with Apple, Google and Outlook calendars). */
export function icsFor(events: CalendarEvent[]): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Olava Invites//Wedding//EN", "CALSCALE:GREGORIAN"];
  events.forEach((e, i) => {
    const end = e.end ?? new Date(new Date(e.start).getTime() + 2 * 3600_000).toISOString();
    lines.push("BEGIN:VEVENT", `UID:${stamp(e.start)}-${i}@olava-invites`, `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${escape(e.title)}`);
    if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** A Google Calendar "add event" link for one event (Google takes one event per link). */
export function googleCalendarUrl(e: CalendarEvent): string {
  const end = e.end ?? new Date(new Date(e.start).getTime() + 2 * 3600_000).toISOString();
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${stamp(e.start)}/${stamp(end)}` });
  if (e.location) q.set("location", e.location);
  if (e.description) q.set("details", e.description);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function downloadIcs(events: CalendarEvent[], fileName: string) {
  const url = URL.createObjectURL(new Blob([icsFor(events)], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${fileName}.ics` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * "Add to calendar": a small menu with Google Calendar (opens Google with the event filled in; one link per
 * event) and Apple / Outlook (a calendar file, which those apps open). In the editor (`disabled`) the menu
 * only explains that it works on the live website and in Preview.
 */
export function AddToCalendar({ events, fileName, className, disabled = false, children }: {
  events: CalendarEvent[]; fileName: string; className?: string; disabled?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  const place = useCallback(() => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const w = 260, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, vw - w - 8));
    const up = r.bottom + 220 > vh && r.top > 220;
    setPos({ left, top: up ? r.top - 8 : r.bottom + 8, up });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const close = (e: Event) => {
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") return;
      const t = e.target as Node | null;
      if (e.type === "pointerdown" && t && (menu.current?.contains(t) || btn.current?.contains(t))) return;
      setOpen(false);
      if (e.type === "keydown") btn.current?.focus();
    };
    const reflow = () => place();
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("resize", reflow);
    window.addEventListener("scroll", reflow, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("resize", reflow);
      window.removeEventListener("scroll", reflow, true);
    };
  }, [open, place]);

  if (events.length === 0) return null;
  return (
    <>
      <button ref={btn} type="button" className={className} aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}>
        {children}
      </button>
      {open && pos ? createPortal(
        <div ref={menu} id={id} className="olv-cal olv-cal-menu" role={disabled ? "note" : "menu"} data-up={pos.up || undefined}
          style={{ left: pos.left, top: pos.top }}>
          {disabled ? (
            <p className="olv-cal olv-cal-note">Guests can add this to Google, Apple or Outlook calendars. It works on your live website and in Preview.</p>
          ) : (
            <>
              {events.map((e, i) => (
                <a key={i} role="menuitem" className="olv-cal olv-cal-item" href={googleCalendarUrl(e)} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
                  <span aria-hidden="true" className="olv-cal olv-cal-ico">G</span>
                  <span>Google Calendar{events.length > 1 ? <small className="olv-cal olv-cal-sub">{e.title}</small> : null}</span>
                </a>
              ))}
              <button type="button" role="menuitem" className="olv-cal olv-cal-item" onClick={() => { downloadIcs(events, fileName); setOpen(false); }}>
                <span aria-hidden="true" className="olv-cal olv-cal-ico">⬇</span>
                <span>Apple / Outlook<small className="olv-cal olv-cal-sub">Calendar file{events.length > 1 ? ` · all ${events.length} events` : ""}</small></span>
              </button>
            </>
          )}
        </div>, document.body) : null}
    </>
  );
}
