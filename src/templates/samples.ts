import type { SiteModel, SiteSection } from "@/lib/api/types";
import { SAMPLE_SECTIONS, sampleDate, sampleEvent, shift } from "./sample";

/** Names of the sections that can show sample content (for notices outside the editor). */
export const SAMPLE_SECTION_NAMES: Partial<Record<SiteSection["key"], string>> = {
  story: "Our story", events: "Events", venue: "Venue", gallery: "Gallery", travel: "Travel & stay", dress_code: "Dress code",
  explore: "Things to do", wedding_party: "Wedding party", faq: "FAQ", registry: "Gift registry", video: "Video",
};

/** The draft's sections that would show sample content (so they won't appear on the live site). */
export function sampleSections(site: SiteModel): SiteSection[] {
  return withSamples(site).sections.filter((s) => s.sample);
}

/** What the "Sample" tag says (editor and private preview only). */
export const SAMPLE_NOTE = "Sample: hidden on your live site until you add your own";

const text = (v: unknown) => {
  const t = v as { text?: string | null; hidden?: boolean } | null;
  return t && typeof t === "object" && !t.hidden && typeof t.text === "string" && t.text.trim() ? t.text : null;
};
const list = (v: unknown) => (Array.isArray(v) ? v : []);
const ref = (v: unknown) => !!(v && typeof v === "object" && (v as { ref?: unknown }).ref);

/**
 * True when a section has nothing of the couple's own to show, so guests would see nothing (the live site leaves
 * it out). Headings and small labels don't count: they come with every new section.
 */
export function isSectionEmpty(section: SiteSection, site: SiteModel): boolean {
  const c = section.content;
  switch (section.key) {
    case "story":
      return !text(c.body) && !ref(c.image) && !list(c.chapters).some((ch) => (ch as { title?: string }).title);
    case "events":
      return site.events.length === 0;
    case "venue":
      return !site.events.some((e) => e.venue);
    case "gallery":
      return site.gallery.length === 0;
    case "travel": case "dress_code": case "explore":
      return !text(c.body) && !ref(c.image) && list(c.links).length === 0 && !list(c.items).some((i) => (i as { title?: string }).title);
    case "wedding_party":
      return !list(c.members).some((m) => (m as { name?: string }).name);
    case "faq":
      return !list(c.items).some((i) => (i as { question?: string }).question);
    case "registry":
      return list(c.links).length === 0;
    case "video":
      return !ref((c.video as { video?: unknown } | undefined)?.video);
    default:
      return false; // hero, welcome, countdown, save the date, RSVP, contact, thank you, custom, footer: never empty
  }
}

/** Keeps the couple's own heading and labels; the rest comes from the sample. */
function merge(own: Record<string, unknown>, sample: Record<string, unknown>) {
  const out = { ...sample };
  for (const key of ["eyebrow", "heading", "intro"]) {
    const v = own[key] as { text?: string | null; hidden?: boolean } | undefined;
    if (v && typeof v === "object" && (v.hidden || (typeof v.text === "string" && v.text.trim()))) out[key] = v;
  }
  return out;
}

/**
 * The editor's and private preview's version of the site: every empty section is filled with realistic sample
 * content and marked `sample`, so the couple can see how it will look. Never applied to the live site, so guests
 * never see invented names, events or questions there (empty sections are simply left out).
 */
export function withSamples(site: SiteModel): SiteModel {
  let changed = false;
  const sections = site.sections.map((s) => {
    const make = SAMPLE_SECTIONS[s.key];
    if (!make || !isSectionEmpty(s, site)) return s;
    changed = true;
    // Events, Venue and Gallery keep their own content; their sample data is the event list / the design's art.
    if (s.key === "events" || s.key === "venue" || s.key === "gallery") return { ...s, sample: true };
    return { ...s, content: merge(s.content, make().content), sample: true };
  });
  if (!changed) return site;

  const needsEvents = sections.some((s) => s.sample && (s.key === "events" || s.key === "venue"));
  let sampleEvents = site.sampleEvents;
  if (needsEvents && !sampleEvents) {
    const date = site.couple.weddingDate ?? sampleDate();
    const venue = { name: "The Lake Palace", addressLine: "Pichola Lake", city: "Udaipur", state: "Rajasthan", postalCode: null, mapUrl: null };
    const garden = { name: "Bagh Garden", addressLine: "City Palace Road", city: "Udaipur", state: "Rajasthan", postalCode: null, mapUrl: null };
    sampleEvents = [
      sampleEvent("Mehendi", "Mehendi", shift(date, -1), "18:30", "22:00", garden, "Henna, folk songs and a dholki night.", "Greens & yellows"),
      sampleEvent("Wedding", "Wedding", date, "10:30", "13:00", venue, "Your presence means the world to us.", "Traditional, jewel tones"),
    ];
  }
  return { ...site, sections, sampleEvents };
}
