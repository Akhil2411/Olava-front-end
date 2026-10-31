import type { SiteSection } from "@/lib/api/types";

/**
 * Section layouts the couple can choose (Edit & design → section → Layout). "design" is the template's own
 * style; the others are shared layouts that every design can show (styled by shared.css, picking up the
 * design's colours and fonts). Values must match the API's section catalogue.
 */
export const GALLERY_LAYOUTS = ["photo-grid", "photo-masonry", "photo-carousel", "photo-filmstrip"] as const;
export const EVENT_LAYOUTS = ["event-cards", "event-timeline", "event-agenda"] as const;
export const FAQ_LAYOUTS = ["faq-open", "faq-cards"] as const;

export type GalleryLayout = (typeof GALLERY_LAYOUTS)[number];
export type EventLayout = (typeof EVENT_LAYOUTS)[number];
export type FaqLayout = (typeof FAQ_LAYOUTS)[number];

export const LAYOUT_LABELS: Record<string, string> = {
  "photo-grid": "Grid", "photo-masonry": "Masonry (mixed sizes)", "photo-carousel": "Carousel (one at a time)", "photo-filmstrip": "Filmstrip (scroll sideways)",
  "event-cards": "Cards", "event-timeline": "Timeline", "event-agenda": "Agenda list",
  "faq-open": "All answers shown", "faq-cards": "Cards",
};

/** What each design does by itself, and which shared layout that already is (so it isn't offered twice). */
interface Native { name: string; same?: string }
export const DESIGN_NATIVE: Record<string, { gallery: Native; events: Native; faq: Native }> = {
  "enchanted-garden": { gallery: { name: "Carousel", same: "photo-carousel" }, events: { name: "Timeline", same: "event-timeline" }, faq: { name: "Accordion" } },
  "modern-indian": { gallery: { name: "Collage" }, events: { name: "Cards", same: "event-cards" }, faq: { name: "Accordion" } },
  cinematic: { gallery: { name: "Film stills collage" }, events: { name: "Film scenes" }, faq: { name: "Accordion" } },
  "black-tie": { gallery: { name: "Filmstrip", same: "photo-filmstrip" }, events: { name: "Deco cards", same: "event-cards" }, faq: { name: "Accordion" } },
  "english-garden": { gallery: { name: "Grid", same: "photo-grid" }, events: { name: "Order of the day", same: "event-agenda" }, faq: { name: "Accordion" } },
  heirloom: { gallery: { name: "Grid", same: "photo-grid" }, events: { name: "Programme", same: "event-agenda" }, faq: { name: "Accordion" } },
  "ivory-letterpress": { gallery: { name: "Grid", same: "photo-grid" }, events: { name: "Programme", same: "event-agenda" }, faq: { name: "Accordion" } },
  riviera: { gallery: { name: "Masonry", same: "photo-masonry" }, events: { name: "Day tabs" }, faq: { name: "Accordion" } },
};

type Kind = "gallery" | "events" | "faq";
const LISTS: Record<Kind, readonly string[]> = { gallery: GALLERY_LAYOUTS, events: EVENT_LAYOUTS, faq: FAQ_LAYOUTS };

/**
 * The layout to draw: a shared layout, or null for the design's own (also for "design", for values saved
 * before layouts worked everywhere, and for the shared layout that is the design's own style anyway).
 */
export function chosenLayout(section: SiteSection, kind: "gallery", design: string): GalleryLayout | null;
export function chosenLayout(section: SiteSection, kind: "events", design: string): EventLayout | null;
export function chosenLayout(section: SiteSection, kind: "faq", design: string): FaqLayout | null;
export function chosenLayout(section: SiteSection, kind: Kind, design: string): string | null {
  const v = section.layoutVariant;
  if (!v || !LISTS[kind].includes(v)) return null;
  return DESIGN_NATIVE[design]?.[kind].same === v ? null : v;
}

/** Layout choices for the editor: the design's own first, then the shared ones it doesn't already match. */
export function layoutOptions(sectionType: string, variants: string[], design: string | null): { value: string; label: string }[] {
  const kind = sectionType === "gallery" ? "gallery" : sectionType === "events" ? "events" : sectionType === "faq" ? "faq" : null;
  const native = kind && design ? DESIGN_NATIVE[design]?.[kind] : undefined;
  return variants
    .filter((v) => v === "design" || v !== native?.same)
    .map((v) => ({ value: v, label: v === "design" ? (native ? `${native.name} (this design's style)` : "This design's style") : LAYOUT_LABELS[v] ?? v }));
}

/** The editor's current value: saved values the editor doesn't offer (older ones) read as the design's own. */
export function layoutValue(section: { layoutVariant: string | null; layoutVariants: string[] }, design: string | null, type: string): string {
  const v = section.layoutVariant;
  const offered = layoutOptions(type, section.layoutVariants, design).map((o) => o.value);
  return v && offered.includes(v) ? v : offered[0] ?? "";
}

/**
 * Which optional event wording the current design shows, so the editor offers only those: the directions link
 * appears in the shared layouts (and the simple fallback design); the "Time" / "Place" labels only in
 * Cinematic's own film-scene layout.
 */
export function eventLabelFields(design: string | null, layout: string): { directions: boolean; timePlace: boolean } {
  const known = !!design && design in DESIGN_NATIVE;
  const shared = layout !== "design" && layout !== "";
  return { directions: !known || shared, timePlace: design === "cinematic" && !shared };
}
