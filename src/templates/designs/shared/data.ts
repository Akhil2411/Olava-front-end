import type { SiteEvent, SiteModel, SiteSection } from "@/lib/api/types";
import { textEl } from "../../content";
import type { RenderContext } from "../../types";
import type { CalendarEvent } from "./AddToCalendar";

/** A text element with what the site should do with it: show it, or (editor) offer it as a placeholder. */
export function el(section: SiteSection, key: string) {
  const t = textEl(section.content, key);
  return { ...t, show: !t.hidden && !!t.text };
}

export const names = (site: SiteModel) => `${site.couple.partnerOneName} & ${site.couple.partnerTwoName}`;
export const initials = (site: SiteModel) =>
  `${site.couple.partnerOneName.trim().slice(0, 1).toUpperCase()} & ${site.couple.partnerTwoName.trim().slice(0, 1).toUpperCase()}`;

const utc = (date: string) => { const [y, m, d] = date.slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const fmt = (date: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "UTC" }).format(utc(date));

/** The main event of the wedding day: the first event on the wedding date (or the first event). */
export function mainEvent(site: SiteModel): SiteEvent | null {
  const day = site.couple.weddingDate;
  return site.events.find((e) => day && e.startsAtLocal.startsWith(day)) ?? site.events[0] ?? null;
}

/** When the countdown ends: the main event's start, otherwise midnight of the wedding date. */
export function countdownTarget(site: SiteModel): string | null {
  const day = site.couple.weddingDate;
  const main = mainEvent(site);
  if (main && (!day || main.startsAtLocal.startsWith(day))) return main.startsAt;
  return day ? `${day}T00:00:00` : null;
}

export function weddingDay(site: SiteModel) {
  const day = site.couple.weddingDate;
  if (!day) return null;
  const main = mainEvent(site);
  const time = main && main.startsAtLocal.startsWith(day) ? timeOf(main.startsAtLocal) : null;
  return {
    long: fmt(day, { month: "long", day: "numeric", year: "numeric" }),          // November 30, 2026 (en-GB: 30 November 2026)
    weekday: fmt(day, { weekday: "long" }),
    dots: fmt(day, { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", " · "), // 30 · 11 · 2026
    time,
  };
}

/** "16:30" local wall-clock → "4:30 PM". */
export function timeOf(local: string): string {
  const [, t = "00:00"] = local.split("T");
  const [h, m] = t.split(":").map(Number);
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" })
    .format(new Date(Date.UTC(2000, 0, 1, h, m))).toUpperCase();
}

/** "Nov 30, 2026" for an event's local start. */
export function dateOf(local: string, o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return fmt(local, o);
}

export function venueLine(v: SiteEvent["venue"]): string | null {
  if (!v) return null;
  return [v.addressLine, v.city, v.state, v.postalCode].filter(Boolean).join(", ") || null;
}

/** Distinct venues used by the events, in event order. */
export function venuesOf(site: SiteModel) {
  const seen = new Map<string, NonNullable<SiteEvent["venue"]> & { events: string[] }>();
  for (const e of site.events) {
    if (!e.venue) continue;
    const key = `${e.venue.name}|${e.venue.addressLine ?? ""}|${e.venue.city ?? ""}`;
    const existing = seen.get(key);
    if (existing) existing.events.push(e.name);
    else seen.set(key, { ...e.venue, events: [e.name] });
  }
  return [...seen.values()];
}

/** The events an Events section shows: the real ones, or (editor/preview, while there are none) sample events. */
export function eventsFor(site: SiteModel): SiteEvent[] {
  return site.events.length ? site.events : site.sampleEvents ?? [];
}

/** The venues a Venue section shows: from the real events, or (editor/preview, while none has a venue) sample ones. */
export function venuesFor(site: SiteModel) {
  const real = venuesOf(site);
  return real.length || !site.sampleEvents ? real : venuesOf({ ...site, events: site.sampleEvents });
}

export function mapsUrl(v: { name: string; mapUrl: string | null; addressLine?: string | null; city?: string | null }): string {
  if (v.mapUrl && /^https:\/\//i.test(v.mapUrl)) return v.mapUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([v.name, v.addressLine, v.city].filter(Boolean).join(", "))}`;
}

export function calendarEvent(site: SiteModel, e: SiteEvent): CalendarEvent {
  return {
    title: `${e.name} · ${names(site)}`, start: e.startsAt, end: e.endsAt,
    location: e.venue ? [e.venue.name, venueLine(e.venue)].filter(Boolean).join(", ") : null,
    description: e.description,
  };
}

/** The wedding day as one calendar entry (the main event, or the whole date). */
export function weddingCalendar(site: SiteModel): CalendarEvent[] {
  const main = mainEvent(site);
  if (main) return [{ ...calendarEvent(site, main), title: `${names(site)} · Wedding` }];
  const day = site.couple.weddingDate;
  return day ? [{ title: `${names(site)} · Wedding`, start: `${day}T00:00:00Z`, end: `${day}T23:59:00Z`, location: null }] : [];
}

export const fileSlug = (site: SiteModel) => names(site).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "wedding";

/** Sections render placeholders in every mode but the live site. */
export const showPlaceholders = (ctx: RenderContext) => ctx.mode !== "public";
export const isEdit = (ctx: RenderContext) => ctx.mode === "edit";

/** Unique ids for a section's SVG gradients and anchors. */
export const uid = (section: SiteSection, i: number) => (section.id ?? `${section.key}-${i}`).replace(/[^A-Za-z0-9_-]/g, "");
