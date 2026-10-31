import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SiteModel, Template, Venue } from "@/lib/api/types";
import { SiteRenderer } from "@/templates/SiteRenderer";
import { sampleSite } from "@/templates/sample";
import { VideoPlayer } from "@/templates/designs/shared/VideoPlayer";
import { claimMusic, onMusicClaimed, onMusicReleased } from "@/templates/designs/shared/events";
import { site } from "../fixtures";

const actions = vi.hoisted(() => ({
  saveEventAction: vi.fn(),
  saveVenueAction: vi.fn(),
  deleteVenueAction: vi.fn(),
  deleteEventAction: vi.fn(),
  reorderEventsAction: vi.fn(),
}));
vi.mock("@/features/events/actions", () => actions);
const { EventFormBody } = await import("@/features/events/components/EventForm");

const base: Omit<Template, "key" | "name" | "layout" | "category"> = {
  description: null, isPremium: false, versionNumber: 1, tier: null, sections: [], features: [],
  palettes: [{ key: "p", name: "p", background: "#ffffff", surface: "#ffffff", accent: "#111111", text: "#111111", muted: "#555555" }],
  fonts: [{ key: "f", name: "F", heading: "Georgia", body: "Georgia" }], defaultPalette: "p", defaultFont: "f",
  defaultSections: ["hero", "events", "venue", "rsvp"],
};
/** One template per design family (and the Basic fallback). */
const DESIGNS: [string, string][] = [
  ["sage-garden", "enchanted-garden"], ["rani-gold", "modern-indian"], ["noor", "cinematic"], ["black-tie", "black-tie"],
  ["english-garden", "english-garden"], ["heirloom", "heirloom"], ["ivory-letterpress", "ivory-letterpress"], ["riviera", "riviera"],
  ["blush-garden", "arch"],
];
const template = (key: string, layout: string): Template => ({ ...base, key, name: key, layout, category: "Test" });

describe("the Sample tag", () => {
  const empty = () => site({ events: [] }); // FAQ and events are empty in this fixture
  it("shows in the editor (as a button that opens the section) and in the private preview", () => {
    const onSelect = vi.fn();
    const { container, unmount } = render(<SiteRenderer site={empty()} mode="edit" imageUrl={() => null} edit={{ selected: null, onSelect }} />);
    const tag = container.querySelector("#faq [data-olava-sample]") as HTMLElement;
    expect(tag).toHaveTextContent("Sample hidden on your live site until you add your own");
    fireEvent.click(tag);
    expect(onSelect).toHaveBeenCalledWith({ sectionId: "s-faq", field: "" });
    expect(container.querySelector("#faq")).toHaveTextContent("Can I bring a plus-one?");
    unmount();

    const preview = render(<SiteRenderer site={empty()} mode="preview" imageUrl={() => null} />);
    expect(preview.container.querySelectorAll("[data-olava-sample]").length).toBeGreaterThanOrEqual(2); // events and FAQ
    expect(preview.container.querySelector("#faq [data-olava-sample]")!.tagName).toBe("P");
  });

  it("never reaches guests: the live site leaves empty sections out", () => {
    const { container } = render(<SiteRenderer site={empty()} mode="public" imageUrl={() => null} />);
    expect(container.querySelector("[data-olava-sample]")).toBeNull();
    expect(container.querySelector("#faq")).toBeNull();
    expect(container).not.toHaveTextContent("Can I bring a plus-one?");
    expect(container).not.toHaveTextContent("Mehendi");
  });
});

describe.each(DESIGNS)("an event without a venue, %s", (key, layout) => {
  it("shows a clean card: no location line, no map link, no venue section", () => {
    const s = sampleSite(template(key, layout));
    const noVenue: SiteModel = { ...s, sections: s.sections.map((x, i) => ({ ...x, id: `s${i}` })), events: s.events.map((e) => ({ ...e, venue: null })) };
    const { container } = render(<SiteRenderer site={noVenue} mode="public" imageUrl={() => null} />);
    const events = container.querySelector("#events")!;
    expect(events).toHaveTextContent(s.events[0].name);
    for (const venue of s.events.map((e) => e.venue?.name).filter(Boolean)) expect(events).not.toHaveTextContent(venue!);
    expect(events).not.toHaveTextContent(/Open in maps|undefined|null/i);
    // No empty element left where the place would have been.
    const blanks = [...events.querySelectorAll("p, span, address, dd, div")].filter((n) => n.children.length === 0 && !n.textContent!.trim()
      && !n.getAttribute("aria-hidden") && /venue|place|loc|where|addr/i.test(n.className));
    expect(blanks.map((n) => n.className)).toEqual([]);
    expect(container.querySelector("#venue")).toBeNull();
  });
});

describe("the 'No venue selected' question", () => {
  const venue = { id: "v1", name: "Bagh Garden" } as Venue;
  const saved = { ok: true as const, data: { id: "e1", name: "Sangeet" } };
  beforeEach(() => { actions.saveEventAction.mockReset().mockResolvedValue(saved); actions.saveVenueAction.mockReset(); });

  const fill = () => {
    fireEvent.change(screen.getByLabelText(/Event name/), { target: { value: "Sangeet" } });
    fireEvent.change(screen.getByLabelText(/^Starts/), { target: { value: "2027-02-13T19:00" } });
  };

  it("asks only when no venue is chosen; Go back saves nothing; Continue saves without a venue", async () => {
    const onSaved = vi.fn();
    render(<EventFormBody weddingId="w" existing={null} venues={[venue]} covers={[]} initialVenueId="" onSaved={onSaved} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));
    const dialog = await screen.findByRole("dialog", { name: "No venue selected" });
    expect(dialog).toHaveTextContent("This event will appear on your website without a location. Do you want to continue anyway?");
    expect(within(dialog).queryByRole("button", { name: "Add a venue" })).toBeNull(); // venues exist
    fireEvent.click(within(dialog).getByRole("button", { name: "Go back" }));
    expect(actions.saveEventAction).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Event name/)).toHaveValue("Sangeet");

    fireEvent.click(screen.getByRole("button", { name: "Add event" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "No venue selected" })).getByRole("button", { name: "Continue without venue" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(actions.saveEventAction.mock.calls[0][2]).toMatchObject({ name: "Sangeet", venueId: null });
  });

  it("doesn't ask when a venue is selected (here: preselected)", async () => {
    render(<EventFormBody weddingId="w" existing={null} venues={[venue]} covers={[]} initialVenueId="v1" onSaved={vi.fn()} />);
    expect(screen.getByLabelText(/^Venue/)).toHaveValue("v1");
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));
    await waitFor(() => expect(actions.saveEventAction).toHaveBeenCalled());
    expect(actions.saveEventAction.mock.calls[0][2]).toMatchObject({ venueId: "v1" });
    expect(screen.queryByRole("dialog", { name: "No venue selected" })).toBeNull();
  });

  it("with no venues yet, offers to add one; the new venue is selected automatically", async () => {
    actions.saveVenueAction.mockResolvedValue({ ok: true, data: { id: "v9", name: "The Lake Palace" } });
    render(<EventFormBody weddingId="w" existing={null} venues={[]} covers={[]} initialVenueId="" onSaved={vi.fn()} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));
    const dialog = await screen.findByRole("dialog", { name: "No venue selected" });
    expect(dialog).toHaveTextContent("You haven't added any venues yet.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Add a venue" }));
    const venueDialog = await screen.findByRole("dialog", { name: "Add venue" });
    fireEvent.change(within(venueDialog).getByLabelText(/Venue name/), { target: { value: "The Lake Palace" } });
    fireEvent.click(within(venueDialog).getByRole("button", { name: "Add venue" }));
    await waitFor(() => expect(screen.getByLabelText(/^Venue/)).toHaveValue("v9"));
    expect(screen.getByLabelText(/Event name/)).toHaveValue("Sangeet"); // the event form kept its answers
    expect(actions.saveEventAction).not.toHaveBeenCalled();
  });
});

describe("VideoPlayer and the design's music", () => {
  it("plays inline with controls, no autoplay, and hands the sound back and forth with the music", () => {
    const claimed = vi.fn();
    const released = vi.fn();
    const offs = [onMusicClaimed(claimed), onMusicReleased(released)];
    const { container } = render(<VideoPlayer src="/v.webm" type="video/webm" title="Our film" />);
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video.autoplay).toBe(false);
    expect(video.getAttribute("preload")).toBe("metadata");

    let paused = true;
    Object.defineProperty(video, "paused", { get: () => paused });
    const pause = vi.spyOn(video, "pause").mockImplementation(() => { paused = true; video.dispatchEvent(new Event("pause")); });
    act(() => { paused = false; video.dispatchEvent(new Event("play")); });
    expect(claimed).toHaveBeenCalledTimes(1); // the music pauses
    act(() => { paused = true; video.dispatchEvent(new Event("pause")); });
    expect(released).toHaveBeenCalledTimes(1); // the music may resume

    act(() => { video.muted = true; paused = false; video.dispatchEvent(new Event("play")); });
    expect(claimed).toHaveBeenCalledTimes(1); // muted: no need to stop the music
    act(() => { video.muted = false; video.dispatchEvent(new Event("volumechange")); });
    expect(claimed).toHaveBeenCalledTimes(2);

    act(() => claimMusic({ kind: "music" })); // the guest starts the music instead
    expect(pause).toHaveBeenCalled();
    offs.forEach((off) => off());
  });
});
