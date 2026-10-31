import { describe, expect, it } from "vitest";
import { chosenLayout, eventLabelFields, layoutOptions, layoutValue } from "@/templates/designs/shared/layouts";
import { FAQ_PRESETS, faqSample, unusedPresets } from "@/features/faq/presets";
import { googleCalendarUrl, icsFor } from "@/templates/designs/shared/AddToCalendar";
import { coverChoices } from "@/features/events/covers";
import type { Media, SiteSection } from "@/lib/api/types";

const sec = (key: SiteSection["key"], layoutVariant: string | null): SiteSection => ({ id: "s1", key, layoutVariant, content: {} });

describe("section layouts", () => {
  it("draws the design's own layout for 'design', old saved values and the layout the design already is", () => {
    expect(chosenLayout(sec("gallery", "design"), "gallery", "modern-indian")).toBeNull();
    expect(chosenLayout(sec("gallery", "grid"), "gallery", "modern-indian")).toBeNull();      // saved before layouts worked
    expect(chosenLayout(sec("gallery", "carousel"), "gallery", "modern-indian")).toBeNull();
    expect(chosenLayout(sec("gallery", null), "gallery", "riviera")).toBeNull();
    expect(chosenLayout(sec("gallery", "photo-carousel"), "gallery", "enchanted-garden")).toBeNull(); // its own style is a carousel
    expect(chosenLayout(sec("gallery", "photo-carousel"), "gallery", "modern-indian")).toBe("photo-carousel");
    expect(chosenLayout(sec("events", "event-timeline"), "events", "cinematic")).toBe("event-timeline");
    expect(chosenLayout(sec("events", "event-agenda"), "events", "heirloom")).toBeNull();      // Heirloom's programme is an agenda
    expect(chosenLayout(sec("faq", "faq-cards"), "faq", "black-tie")).toBe("faq-cards");
  });

  it("offers the design's own style first, named, and never the same layout twice", () => {
    const gallery = ["design", "photo-grid", "photo-masonry", "photo-carousel", "photo-filmstrip"];
    const eg = layoutOptions("gallery", gallery, "enchanted-garden");
    expect(eg[0]).toEqual({ value: "design", label: "Carousel (this design's style)" });
    expect(eg.map((o) => o.value)).toEqual(["design", "photo-grid", "photo-masonry", "photo-filmstrip"]);
    expect(layoutOptions("gallery", gallery, "modern-indian").map((o) => o.value)).toHaveLength(5);
    expect(layoutValue({ layoutVariant: "grid", layoutVariants: gallery }, "modern-indian", "gallery")).toBe("design");
    expect(layoutValue({ layoutVariant: "photo-carousel", layoutVariants: gallery }, "enchanted-garden", "gallery")).toBe("design");
    expect(layoutValue({ layoutVariant: "photo-masonry", layoutVariants: gallery }, "modern-indian", "gallery")).toBe("photo-masonry");
  });

  it("offers only the event wording the design shows", () => {
    expect(eventLabelFields("cinematic", "design")).toEqual({ directions: false, timePlace: true });
    expect(eventLabelFields("cinematic", "event-cards")).toEqual({ directions: true, timePlace: false });
    expect(eventLabelFields("riviera", "design")).toEqual({ directions: false, timePlace: false });
    expect(eventLabelFields("unknown-design", "design")).toEqual({ directions: true, timePlace: false });
  });
});

describe("FAQ common questions", () => {
  it("has the agreed starting list, hides questions already added and offers sample answers as hints only", () => {
    expect(FAQ_PRESETS.length).toBeGreaterThanOrEqual(10);
    expect(unusedPresets(["  is there a DRESS code? "]).some((p) => p.question === "Is there a dress code?")).toBe(false);
    expect(unusedPresets([]).length).toBe(FAQ_PRESETS.length);
    expect(faqSample("Is there parking at the venue?")).toMatch(/^e\.g\. /);
    expect(faqSample("Our own question")).toBe("Type your answer");
  });
});

describe("add to calendar", () => {
  const e = { title: "Wedding · A & B", start: "2026-11-30T05:00:00Z", end: null, location: "Hall, Kochi", description: "Muhurtham" };
  it("builds a Google Calendar link with the event filled in (2 hours when there's no end time)", () => {
    const url = new URL(googleCalendarUrl(e));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("Wedding · A & B");
    expect(url.searchParams.get("dates")).toBe("20261130T050000Z/20261130T070000Z");
    expect(url.searchParams.get("location")).toBe("Hall, Kochi");
    expect(url.searchParams.get("details")).toBe("Muhurtham");
  });
  it("still makes a calendar file for Apple and Outlook", () => {
    expect(icsFor([e])).toContain("DTSTART:20261130T050000Z");
  });
});

describe("event cover choices", () => {
  const m = (id: string, purpose: Media["purpose"], contentType: string) => ({ id, purpose, contentType }) as Media;
  it("offers photos only, never videos or music", () => {
    expect(coverChoices([m("a", "Gallery", "image/jpeg"), m("v", "Video", "video/mp4"), m("s", "Music", "audio/mpeg"), m("c", "EventCover", "image/png")]).map((x) => x.id))
      .toEqual(["a", "c"]);
  });
});
