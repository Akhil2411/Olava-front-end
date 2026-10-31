import { describe, expect, it } from "vitest";
import { DEFAULT_SELECTION, isOpenSetup, progressOf, stepsFor } from "@/features/setup/steps";
import { videoProblem } from "@/features/editor/video";
import { defaultVenueId } from "@/features/events/components/EventForm";
import { isSectionEmpty, sampleSections, withSamples } from "@/templates/samples";
import type { Venue, WeddingEvent } from "@/lib/api/types";
import { section, site, t } from "../fixtures";

describe("walkthrough steps", () => {
  it("pre-selects story, events, countdown, gallery and RSVP", () => {
    expect(DEFAULT_SELECTION).toEqual(["story", "events", "countdown", "gallery", "rsvp"]);
  });

  it("has one form per chosen section that has one (none for countdown, venue, contact, save the date)", () => {
    expect(stepsFor(DEFAULT_SELECTION)).toEqual(["couple", "design", "sections", "story", "events", "gallery", "rsvp", "done"]);
    expect(stepsFor(["events", "video", "countdown", "venue", "contact", "save_the_date", "dress_code"]))
      .toEqual(["couple", "design", "sections", "events", "dress_code", "video", "done"]);
  });

  it("reports where it would resume", () => {
    expect(progressOf({ step: "rsvp", sections: ["story", "events", "rsvp"] })).toEqual({ index: 6, total: 7 });
    expect(progressOf({ step: null, sections: [] })).toEqual({ index: 2, total: 8 }); // nothing saved yet: the design step
    expect(progressOf({ step: "sections", sections: [] })).toEqual({ index: 3, total: 8 });
    expect(isOpenSetup({ status: "skipped", step: "rsvp", sections: [] })).toBe(true);
    expect(isOpenSetup({ status: "dismissed", step: "rsvp", sections: [] })).toBe(false);
    expect(isOpenSetup({ status: "done", step: "done", sections: [] })).toBe(false);
  });
});

describe("video file check (in the browser, before uploading)", () => {
  const mb = 1024 * 1024;
  it("accepts MP4 and WebM up to 30 MB", () => {
    expect(videoProblem({ name: "a.mp4", type: "video/mp4", size: 30 * mb })).toBeNull();
    expect(videoProblem({ name: "a.webm", type: "video/webm", size: 1 })).toBeNull();
    expect(videoProblem({ name: "a.MP4", type: "", size: 10 })).toBeNull(); // some systems give no type
  });
  it("refuses larger files with the agreed message", () => {
    expect(videoProblem({ name: "a.mp4", type: "video/mp4", size: 30 * mb + 1 })).toBe("This video is larger than 30 MB. Please choose a smaller file.");
  });
  it("refuses other types, with an export hint for .mov", () => {
    expect(videoProblem({ name: "a.mov", type: "video/quicktime", size: 10 })).toMatch(/QuickTime \(\.mov\).*MP4/);
    expect(videoProblem({ name: "a.avi", type: "video/x-msvideo", size: 10 })).toBe("This file type isn't supported. Upload an MP4 or WebM video.");
    expect(videoProblem({ name: "a.jpg", type: "image/jpeg", size: 10 })).toBe("This file type isn't supported. Upload an MP4 or WebM video.");
    expect(videoProblem({ name: "a.mp4", type: "video/mp4", size: 0 })).toBe("The file is empty.");
  });
});

describe("venue preselection for a new event", () => {
  const v = (id: string) => ({ id, name: id }) as Venue;
  const e = (venueId: string | null, startsAtLocal: string) => ({ id: startsAtLocal, venueId, startsAtLocal }) as unknown as WeddingEvent;
  it("picks the only venue, or the most recent event's venue, else none", () => {
    expect(defaultVenueId([], [])).toBe("");
    expect(defaultVenueId([], [v("a")])).toBe("a");
    expect(defaultVenueId([e("a", "2027-01-01T10:00"), e("b", "2027-01-02T10:00")], [v("a"), v("b")])).toBe("b");
  });
});

describe("sample content for empty sections", () => {
  it("knows which sections are empty", () => {
    const s = site();
    const by = (key: string) => s.sections.find((x) => x.key === key)!;
    expect(isSectionEmpty(by("story"), s)).toBe(false);   // has a body
    expect(isSectionEmpty(by("faq"), s)).toBe(true);      // no questions
    expect(isSectionEmpty(by("gallery"), s)).toBe(false); // one photo
    expect(isSectionEmpty(by("events"), s)).toBe(false);
    expect(isSectionEmpty(by("events"), site({ events: [] }))).toBe(true);
    expect(isSectionEmpty(by("rsvp"), s)).toBe(false);    // never "empty"
    expect(isSectionEmpty(section("v", "video", { heading: t("Our video"), video: { video: null } }), s)).toBe(true);
    expect(isSectionEmpty(section("v", "video", { heading: t("Our video"), video: { video: { ref: "x", contentType: "video/mp4" } } }), s)).toBe(false);
  });

  it("fills only empty sections, flags them, keeps the couple's heading and never changes the input", () => {
    const input = site({ events: [] });
    const before = JSON.stringify(input);
    const out = withSamples(input);
    expect(JSON.stringify(input)).toBe(before);
    const faq = out.sections.find((x) => x.key === "faq")!;
    expect(faq.sample).toBe(true);
    expect((faq.content.items as unknown[]).length).toBe(3);
    expect(faq.content.heading).toEqual(t("FAQ")); // their heading, not the sample's
    expect(out.sections.find((x) => x.key === "story")!.sample).toBeFalsy();
    expect(out.sections.find((x) => x.key === "events")!.sample).toBe(true);
    expect(out.sampleEvents?.map((e) => e.name)).toEqual(["Mehendi", "Wedding"]);
    expect(sampleSections(input).map((x) => x.key)).toEqual(["events", "faq"]);
  });

  it("drops a section's sample once it has real content", () => {
    const filled = site();
    const faq = filled.sections.find((x) => x.key === "faq")!;
    faq.content = { ...faq.content, items: [{ question: "Parking?", answer: "Yes." }] };
    expect(sampleSections(filled)).toEqual([]);
    expect(withSamples(filled).sections.find((x) => x.key === "faq")!.content.items).toEqual([{ question: "Parking?", answer: "Yes." }]);
  });
});

describe("event types (Kerala and Indian)", () => {
  it("offers Wedding (not Ceremony) and the Kerala events, and keeps an older value when editing", async () => {
    const { EVENT_TYPES, EVENT_SUGGESTIONS, eventTypeOptions } = await import("@/features/events/types");
    expect(EVENT_TYPES).toContain("Wedding");
    expect(EVENT_TYPES).not.toContain("Ceremony");
    for (const t of ["Engagement (Nischayam)", "Betrothal (Manasammatham)", "Madhuramvekkal", "Mehendi / Mylanchi", "Nikah", "Walima"]) expect(EVENT_TYPES).toContain(t);
    expect(EVENT_SUGGESTIONS.every((s) => (EVENT_TYPES as readonly string[]).includes(s.type))).toBe(true);
    expect(eventTypeOptions("Ceremony")[0]).toBe("Ceremony");    // an event saved before keeps its type
    expect(eventTypeOptions("Wedding")).toEqual([...EVENT_TYPES]); // no duplicate
  });
});
