import type { SiteEvent, SiteModel, SiteSection, Template } from "@/lib/api/types";

const t = (text: string | null, hidden = false) => ({ text, hidden });
const noImage = { ref: null, width: null, height: null, alt: null, hidden: false };
const section = (key: SiteSection["key"], content: Record<string, unknown>, layoutVariant: string | null = null): SiteSection =>
  ({ id: null, key, layoutVariant, content });

/** A wedding date that is always a few months away, so the countdown has something to count. */
export function sampleDate(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), 10, 30)); // 30 November
  if (d.getTime() - now.getTime() < 30 * 86_400_000) d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export const shift = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** London wall-clock time → instant (sample only: GMT in late November). */
export function sampleEvent(name: string, type: string, date: string, start: string, end: string | null, venue: SiteEvent["venue"], description: string | null, dressCode: string | null): SiteEvent {
  return {
    name, eventType: type, description, dressCode, notes: null, venue, cover: null,
    startsAtLocal: `${date}T${start}`, endsAtLocal: end ? `${date}T${end}` : null,
    startsAt: `${date}T${start}:00Z`, endsAt: end ? `${date}T${end}:00Z` : null,
  };
}

/** Sample content per section type (template gallery, and the editor's samples for empty sections). */
export const SAMPLE_SECTIONS: Record<string, () => SiteSection> = {
  hero: () => section("hero", {
    eyebrow: t("We're getting married"), tagline: t("invite you to celebrate their wedding"), joiner: t("&"), image: noImage,
    partnerOneFamily: t("Son of Mr. & Mrs. Malik"), partnerOneDetails: t("B.E., M.S.\nData Scientist"),
    partnerTwoFamily: t("Daughter of Mr. & Mrs. Nasser"), partnerTwoDetails: t("MBBS, MD\nPediatrician"),
    hideDate: false, hideVenue: false,
  }),
  welcome: () => section("welcome", {
    eyebrow: t("Welcome"), heading: t("Dear family & friends"),
    body: t("We are honoured to welcome you to our wedding as we begin our journey together in faith and love. Thank you for being part of this blessed occasion."),
    signature: t("With love,"),
  }),
  save_the_date: () => section("save_the_date", {
    eyebrow: t(null, true), heading: t("Scratch to reveal"), note: t("You're invited!"),
    scratchHint: "Scratch the heart to reveal the date", scratch: true, buttonLabel: "Save the date",
  }),
  countdown: () => section("countdown", {
    heading: t("Counting down to forever"), daysLabel: "days to go", dayLabel: "day to go", todayText: "Today!",
    daysUnit: "Days", hoursUnit: "Hours", minutesUnit: "Minutes", secondsUnit: "Seconds",
  }),
  story: () => section("story", {
    eyebrow: t("Our story"), heading: t("How it all began"), body: t("Six years, three cities and one very lucky umbrella."), image: noImage,
    chapters: [
      { label: "2019 · London", title: "A borrowed umbrella", text: "We met on the rainiest day of the year, both reaching for the last umbrella by the library door. The walk to the station took two hours." },
      { label: "2022 · Udaipur", title: "The city of lakes", text: "Our first journey together, ending with a boat at sunset and the quiet certainty that this was it." },
      { label: "2025 · Paris", title: "She said yes", text: "A quiet bridge, a ring hidden inside her favourite book, and a very loud yes." },
    ],
  }),
  events: () => section("events", {
    eyebrow: t("Join us"), heading: t("Programme"), intro: t(null), directionsLabel: "Get directions", dressCodeLabel: "Dress code:",
    emptyText: "Event details are coming soon.", calendarLabel: "Add to calendar", showCalendar: true,
  }, "design"),
  venue: () => section("venue", { eyebrow: t("Venue"), heading: t("Where to find us"), intro: t(null), directionsLabel: "Open in Maps" }),
  gallery: () => section("gallery", { eyebrow: t("Gallery"), heading: t("Moments so far"), intro: t(null) }, "design"),
  dress_code: () => section("dress_code", {
    eyebrow: t("Attire"), heading: t("Dress code"), body: t("Suggestions, not rules. Come as you're comfortable."), image: noImage, links: [],
    items: [
      { label: "Women", title: "Elegant formal attire", text: "Pastel or jewel tones, lehengas, sarees or gowns.", colors: ["#8b1e2b", "#d9a85b", "#f2e3b3", "#4f6b2a"] },
      { label: "Men", title: "Suit or traditional wear", text: "Sherwanis, bandhgalas or a well-cut suit.", colors: ["#1c2547", "#c9d1e0", "#0b0908"] },
    ],
  }),
  travel: () => section("travel", {
    eyebrow: t("For our guests"), heading: t("Travel & stay"), body: t(null), image: noImage, links: [],
    items: [
      { label: "Getting there", title: "Shuttle from the station", text: "A shuttle runs from Central Station to the venue every 30 minutes from 9:00 AM." },
      { label: "Where to stay", title: "The Grand Palace Hotel", text: "Five minutes from the venue. Use code WEDDING when booking for our special rate." },
    ],
  }),
  explore: () => section("explore", {
    eyebrow: t("Things to do"), heading: t("Make a holiday of it"), body: t(null), image: noImage, links: [],
    items: [
      { title: "The old town", text: "Cobbled lanes, markets and the best coffee in the city." },
      { title: "The botanical gardens", text: "A quiet walk among the glasshouses, ten minutes from the venue." },
    ],
  }),
  registry: () => section("registry", {
    eyebrow: t("Gifts"), heading: t("Gifts"), intro: t("Your love, blessings and presence are the greatest gifts we could ask for."),
    links: [
      { label: "Our honeymoon fund", url: "https://example.com/honeymoon", description: "Help us explore Japan in spring." },
      { label: "Gift registry", url: "https://example.com/registry", description: "A few things for our first home." },
    ],
  }),
  wedding_party: () => section("wedding_party", {
    eyebrow: t("With love & thanks"), heading: t("The wedding party"), intro: t(null),
    members: [{ name: "Amara Khan", role: "Maid of honour" }, { name: "Omar Malik", role: "Best man" }, { name: "Leila Nasser", role: "Bridesmaid" }, { name: "Sami Rahman", role: "Groomsman" }],
  }),
  rsvp: () => section("rsvp", { eyebrow: t("RSVP"), heading: t("Will you join us?"), intro: t(null) }),
  faq: () => section("faq", {
    eyebrow: t("Good to know"), heading: t("Questions"), intro: t(null),
    items: [
      { question: "Can I bring a plus-one?", answer: "If your invitation includes a guest, their name will be on it." },
      { question: "Are children welcome?", answer: "Absolutely! Little ones are welcome at every celebration." },
      { question: "Is there parking at the venue?", answer: "Yes, free parking is available on site, and valets will be there from 6 PM." },
    ],
  }),
  thank_you: () => section("thank_you", { eyebrow: t("With love"), heading: t("Thank you"), body: t("Thank you for being part of our story."), image: noImage, links: [], items: [] }),
  video: () => section("video", {
    eyebrow: t("Watch"), heading: t("Our story on film"), body: t("A few moments from the last six years, set to the song from our first dance."),
    video: { video: null, poster: null },
  }),
  contact: () => section("contact", { eyebrow: t("Contact"), heading: t("Questions?"), note: t("Message us any time."), showEmail: false, showPhone: false }),
};

/** Sample data for the template gallery's live preview (no customer data is ever shown). */
export function sampleSite(template: Template, paletteKey?: string): SiteModel {
  const palette = template.palettes.find((p) => p.key === (paletteKey ?? template.defaultPalette)) ?? template.palettes[0];
  const font = template.fonts.find((f) => f.key === template.defaultFont) ?? template.fonts[0];
  const date = sampleDate();
  const hall = { name: "Grand Palace Hall", addressLine: "12 Palace Gardens", city: "London", state: null, postalCode: null, mapUrl: null };
  const home = { name: "The Bride's Family Home", addressLine: "Wimbledon", city: "London", state: null, postalCode: null, mapUrl: null };
  const keys = template.defaultSections?.length ? template.defaultSections : ["hero", "story", "events", "faq", "rsvp"];
  return {
    couple: { title: "Zayn & Nora", partnerOneName: "Zayn", partnerTwoName: "Nora", weddingDate: date, timeZoneId: "Europe/London", language: "en" },
    template: { key: template.key, name: template.name, versionNumber: template.versionNumber, layout: template.layout },
    theme: { palette, font },
    sections: [...keys.filter((k) => SAMPLE_SECTIONS[k]).map((k) => SAMPLE_SECTIONS[k]()), section("footer", { line: t(null), badge: t("Regards from Olava Invites") })],
    events: [
      sampleEvent("Mehendi", "Mehendi", shift(date, -2), "18:30", null, home, "Henna, folk songs and a dholki night.", "Greens & yellows"),
      sampleEvent("Wedding", "Wedding", date, "10:30", "13:00", hall, "Your presence means a lot to us!", "Traditional, jewel tones"),
      sampleEvent("Reception", "Reception", shift(date, 2), "19:30", "23:00", hall, "Dinner, speeches and dancing.", "Evening wear"),
    ],
    gallery: [],
    rsvp: { enabled: true, deadline: shift(date, -29), allowUndecided: true, maxPlusOnes: 1, collectMessage: true, isOpen: true },
    contact: null,
    generatedAt: new Date(0).toISOString(),
    schemaVersion: 2,
    music: template.features?.includes("music")
      ? { track: template.layout === "modern-indian" ? "raga" : template.layout === "cinematic" ? "diya" : "music-box", audio: null, icon: "note", color: null, position: "bottom-right" }
      : null,
  };
}
