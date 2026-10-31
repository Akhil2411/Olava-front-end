import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SiteModel, Template } from "@/lib/api/types";
import { SiteRenderer } from "@/templates/SiteRenderer";
import { sampleSite } from "@/templates/sample";
import { MusicButton, iconInk } from "@/templates/designs/shared/MusicButton";

const sage: Template = {
  key: "sage-garden", name: "Sage Garden", description: null, category: "Enchanted Garden", isPremium: true, versionNumber: 1,
  layout: "enchanted-garden", tier: null, sections: [], features: ["music"],
  palettes: [{ key: "sage-garden", name: "Sage", background: "#f4f1eb", surface: "#f8f6f1", accent: "#2f3c2b", text: "#3e3830", muted: "#7b7366" }],
  fonts: [{ key: "f", name: "F", heading: "Great Vibes", body: "Cormorant Garamond" }], defaultPalette: "sage-garden", defaultFont: "f",
  defaultSections: ["hero", "welcome", "save_the_date", "gallery", "countdown", "events", "venue", "dress_code", "travel", "registry", "rsvp"],
};

function withHero(site: SiteModel, content: Record<string, unknown>): SiteModel {
  return { ...site, sections: site.sections.map((s, i) => ({ ...s, id: `s${i}`, content: s.key === "hero" ? { ...s.content, ...content } : s.content })) };
}
const line = (text: string | null, hidden = false) => ({ text, hidden });

describe("Enchanted Garden design", () => {
  it("renders the couple, the opening doors and every starter section", () => {
    const { container } = render(<SiteRenderer site={sampleSite(sage)} mode="public" imageUrl={() => null} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Zayn.*Nora/);
    expect(screen.getByRole("button", { name: "Tap to open" })).toBeInTheDocument();
    const ids = [...container.querySelectorAll("section[id]")].map((e) => e.id);
    for (const id of ["welcome", "save-the-date", "countdown", "events", "venue", "dress-code", "travel", "registry", "rsvp"])
      expect(ids).toContain(id);
    expect(ids).not.toContain("gallery"); // no photos yet: guests don't see an empty gallery
    expect(container.querySelector("nav")).toBeNull(); // no section menu
  });

  it("shows the parents' and second lines only when filled in and not hidden", () => {
    const site = withHero(sampleSite(sage), {
      partnerOneFamily: line("Son of Mr. & Mrs. Malik"), partnerOneDetails: line("B.E., M.S.", true),
      partnerTwoFamily: line(null), partnerTwoDetails: line("MBBS, MD"),
    });
    render(<SiteRenderer site={site} mode="public" imageUrl={() => null} />);
    expect(screen.getByText("Son of Mr. & Mrs. Malik")).toBeInTheDocument();
    expect(screen.queryByText("B.E., M.S.")).toBeNull();          // hidden by the host
    expect(screen.getByText("MBBS, MD")).toBeInTheDocument();
    expect(screen.queryByText(/Add .* family line/)).toBeNull();  // editor placeholders never reach guests
  });

  it("offers the empty lines as tap-to-add placeholders in the editor", () => {
    const site = withHero(sampleSite(sage), { partnerOneFamily: line(null), partnerTwoFamily: line(null) });
    render(<SiteRenderer site={site} mode="edit" imageUrl={() => null} edit={{ selected: null, onSelect: vi.fn() }} />);
    expect(screen.getByText("Add Zayn's family line")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tap to open" })).toBeNull(); // no opening animation while editing
  });
});

describe("MusicButton", () => {
  const music = { track: "music-box" as const, audio: null, icon: "heart" as const, color: "#2f3c2b", position: "top-right" as const };

  it("uses the chosen icon, colour and corner and starts paused", () => {
    const { container } = render(<MusicButton music={music} src={null} accent="#000000" />);
    const button = screen.getByRole("button", { name: "Play music" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveStyle({ background: "#2f3c2b", color: "#ffffff" });
    expect(container.querySelector(".olv-music")).toHaveAttribute("data-position", "top-right");
    expect(container.querySelectorAll("svg path").length).toBe(1); // the heart, with no crossed-out line
  });

  it("falls back to the design colour and picks readable ink", () => {
    render(<MusicButton music={{ ...music, color: null }} src={null} accent="#f0cf8a" />);
    expect(screen.getByRole("button", { name: "Play music" })).toHaveStyle({ background: "#f0cf8a", color: "#1d1a18" });
    expect(iconInk("#ffffff")).toBe("#1d1a18");
    expect(iconInk("#111111")).toBe("#ffffff");
  });

  it("starts the music when the guest opens the invitation", async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("Audio", class { loop = false; volume = 1; preload = ""; play = play; pause = vi.fn(); });
    render(<MusicButton music={{ ...music, track: "custom" }} src="/a.mp3" accent="#000" />);
    const { announceInviteOpened } = await import("@/templates/designs/shared/events");
    await act(async () => { announceInviteOpened(); });
    expect(play).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pause music" })).toHaveAttribute("aria-pressed", "true");
    vi.unstubAllGlobals();
  });
});

const rani: Template = {
  ...sage, key: "rani-gold", name: "Rani & Gold", category: "Modern Indian", layout: "modern-indian",
  palettes: [{ key: "rani-gold", name: "Rani", background: "#f8efe9", surface: "#fffaf6", accent: "#7a1f4b", text: "#2e1020", muted: "#6e5560" }],
  defaultPalette: "rani-gold",
  defaultSections: ["hero", "countdown", "story", "events", "gallery", "venue", "travel", "dress_code", "rsvp", "faq"],
};

describe("Modern Indian design", () => {
  it("opens with the sealed envelope and has no section menu", () => {
    const { container } = render(<SiteRenderer site={sampleSite(rani)} mode="public" imageUrl={() => null} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Zayn.*Nora/);
    expect(screen.getByRole("button", { name: "Z&N: break the seal to open the invitation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
    const ids = [...container.querySelectorAll("section[id]")].map((e) => e.id);
    for (const id of ["countdown", "story", "events", "venue", "travel", "dress-code", "rsvp", "faq"]) expect(ids).toContain(id);
    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelector(".burger, .drawer")).toBeNull();
  });

  it("sets the end of each heading in the accent italic, as the supplied design does", () => {
    const { container } = render(<SiteRenderer site={sampleSite(rani)} mode="public" imageUrl={() => null} />);
    const story = container.querySelector("#story h2")!;
    expect(story.querySelector("em")?.textContent).toBe(story.textContent!.split(" ").at(-1));
    expect(container.querySelector("#rsvp h2 em")?.textContent).toBe("join us?");     // short last word → last two
  });

  it("shows the family lines and hides what the host hid", () => {
    const site = withHero(sampleSite(rani), { partnerOneFamily: line("Son of Mr. & Mrs. Malik"), partnerTwoDetails: line("MBBS, MD", true) });
    render(<SiteRenderer site={site} mode="public" imageUrl={() => null} />);
    expect(screen.getByText("Son of Mr. & Mrs. Malik")).toBeInTheDocument();
    expect(screen.queryByText("MBBS, MD")).toBeNull();
  });

  it("in the editor: no envelope, placeholders for empty lines, and the real RSVP form (look-only)", () => {
    const site = withHero(sampleSite(rani), { partnerOneFamily: line(null) });
    const { container } = render(<SiteRenderer site={site} mode="edit" imageUrl={() => null} edit={{ selected: null, onSelect: vi.fn() }} />);
    expect(screen.queryByRole("button", { name: /break the seal/i })).toBeNull();
    expect(screen.getByText("Add Zayn's family line")).toBeInTheDocument();
    expect(container.querySelector("#rsvp form.olv-rsvp")).toHaveAttribute("data-mode", "edit");
    expect(container.querySelector(".olv-mi .page")).toHaveClass("ready");          // entrance shown at once
  });
});

/** The Classic designs (Standard tier): one template each, layout key = template key. */
const STARTERS: Record<string, string[]> = {
  "black-tie": ["hero", "countdown", "events", "story", "gallery", "dress_code", "travel", "rsvp", "faq"],
  "english-garden": ["hero", "welcome", "story", "events", "wedding_party", "travel", "registry", "faq", "rsvp"],
  heirloom: ["hero", "story", "events", "travel", "rsvp", "registry"],
  "ivory-letterpress": ["hero", "countdown", "story", "events", "wedding_party", "travel", "registry", "rsvp"],
  riviera: ["hero", "welcome", "events", "travel", "explore", "gallery", "rsvp", "faq"],
};
const classic = (key: string): Template => ({
  key, name: key, description: null, category: "Classic", isPremium: false, versionNumber: 1, layout: key, tier: null, sections: [], features: [],
  palettes: [{ key, name: key, background: "#ffffff", surface: "#ffffff", accent: "#111111", text: "#111111", muted: "#555555" }],
  fonts: [{ key: "f", name: "F", heading: "Georgia", body: "Georgia" }], defaultPalette: key, defaultFont: "f", defaultSections: STARTERS[key],
});
/** Where each section ends up: its own <section>, or (countdown) inside the hero of most Classic designs. */
const anchor = (key: string) => key.replace(/_/g, "-");

describe.each(Object.keys(STARTERS))("Classic design: %s", (key) => {
  it("renders the couple once, every starter section, no menu, no music and no embedded map", () => {
    const { container } = render(<SiteRenderer site={sampleSite(classic(key))} mode="public" imageUrl={() => null} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Zayn.*Nora/);
    expect(container.querySelector(`.olv-cl[data-theme="${key}"]`)).not.toBeNull();
    for (const s of STARTERS[key].filter((k) => k !== "hero" && k !== "gallery"))
      expect(container.querySelector(`#${anchor(s)}[data-section]`), s).not.toBeNull();
    expect(container.querySelector("#gallery")).toBeNull(); // no photos yet: guests don't see an empty gallery
    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.queryByRole("button", { name: /music/i })).toBeNull();
    expect(container.querySelector(".cl-page")).toHaveClass("intro"); // the opening runs on the site
    expect(screen.getByText("Regards from Olava Invites")).toBeInTheDocument();
  });

  it("shows the family lines and hides what the host hid", () => {
    const site = withHero(sampleSite(classic(key)), { partnerOneFamily: line("Son of Mr. & Mrs. Malik"), partnerTwoDetails: line("MBBS, MD", true) });
    render(<SiteRenderer site={site} mode="public" imageUrl={() => null} />);
    expect(screen.getByText("Son of Mr. & Mrs. Malik")).toBeInTheDocument();
    expect(screen.queryByText("MBBS, MD")).toBeNull();
  });

  it("in the editor: no opening, placeholders for empty lines, the gallery to fill in and the look-only RSVP form", () => {
    const site = withHero(sampleSite(classic(key)), { partnerOneFamily: line(null) });
    const { container } = render(<SiteRenderer site={site} mode="edit" imageUrl={() => null} edit={{ selected: null, onSelect: vi.fn() }} />);
    expect(container.querySelector(".cl-page")).not.toHaveClass("intro");
    expect(container.querySelector("[data-olava-intro]")).toBeNull();
    expect(screen.getByText("Add Zayn's family line")).toBeInTheDocument();
    expect(container.querySelector("#rsvp form.olv-rsvp")).toHaveAttribute("data-mode", "edit");
    if (STARTERS[key].includes("gallery")) expect(container.querySelector("#gallery")).not.toBeNull();
  });
});

describe("Classic design details", () => {
  it("Heirloom numbers its chapters with CSS (so hidden sections don't leave gaps) and has the crest opening with a skip button", () => {
    const { container } = render(<SiteRenderer site={sampleSite(classic("heirloom"))} mode="public" imageUrl={() => null} />);
    expect(screen.getByRole("button", { name: "Open the book" })).toBeInTheDocument();
    expect(container.querySelectorAll(".chapter .num")).not.toHaveLength(0);
    expect([...container.querySelectorAll(".chapter .num")].every((n) => n.textContent === "")).toBe(true);
    expect(container.querySelector(".toc")).toBeNull(); // the contents page is gone (by decision)
    expect(container.querySelector("#registry.epilogue")).not.toBeNull();
  });

  it("Riviera groups the events by day into tabs, and lists every day in the editor", () => {
    const { container } = render(<SiteRenderer site={sampleSite(classic("riviera"))} mode="public" imageUrl={() => null} />);
    const days = new Set(sampleSite(classic("riviera")).events.map((e) => e.startsAtLocal.slice(0, 10))).size;
    expect(screen.getAllByRole("tab")).toHaveLength(days);
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
    expect(container.querySelectorAll("[role=tabpanel]:not([hidden])")).toHaveLength(1);
    const { container: ed } = render(<SiteRenderer site={sampleSite(classic("riviera"))} mode="edit" imageUrl={() => null} edit={{ selected: null, onSelect: vi.fn() }} />);
    expect(ed.querySelectorAll("[role=tab]")).toHaveLength(0);
    expect(ed.querySelectorAll(".panel")).toHaveLength(days);
  });

  it("English Garden and Ivory Letterpress show the countdown inside the hero, tied to the countdown section", () => {
    const eg = { ...classic("english-garden"), defaultSections: ["hero", "countdown", "events", "rsvp"] };
    const { container } = render(<SiteRenderer site={sampleSite(eg)} mode="public" imageUrl={() => null} />);
    expect(container.querySelector(".panel [id=countdown][data-section=countdown]")).not.toBeNull();
    const { container: il } = render(<SiteRenderer site={sampleSite(classic("ivory-letterpress"))} mode="public" imageUrl={() => null} />);
    // [id=…], not #…: jsdom resolves #id through the whole document, and the first render also has one.
    expect(il.querySelector(".hero [id=countdown][data-section=countdown]")).not.toBeNull();
  });
});

describe("Classic gallery viewer", () => {
  it("opens a photo full screen, moves with the arrows and closes with Escape, returning focus", async () => {
    const { Photos } = await import("@/templates/designs/classic/Photos");
    const { fireEvent } = await import("@testing-library/react");
    const tiles = [1, 2, 3].map((n) => ({ src: `/p${n}.jpg`, alt: `Photo ${n}` }));
    render(<Photos tiles={tiles} layout="film" interactive />);
    const second = screen.getByRole("button", { name: "Open photo 2 of 3: Photo 2" });
    fireEvent.click(second);
    expect(screen.getByRole("dialog", { name: "Photo viewer" })).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(second).toHaveFocus();
  });
});

/** Cinematic (Premium, from folder 004): one design, five colourways. */
const CINEMATIC_KEYS = ["noor", "royal-gold", "emerald-maharani", "rose-dusk", "midnight-sapphire"];
const cinematic = (key: string): Template => ({
  ...sage, key, name: key, category: "Cinematic", layout: "cinematic",
  palettes: [{ key, name: key, background: "#0b0908", surface: "#16110e", accent: "#d9a85b", text: "#f3ebe0", muted: "#8d8378" }],
  defaultPalette: key,
  defaultSections: ["hero", "countdown", "welcome", "story", "events", "wedding_party", "gallery", "venue", "travel", "dress_code", "rsvp", "faq"],
});

describe.each(CINEMATIC_KEYS)("Cinematic design: %s", (key) => {
  it("opens with the title card, shows every starter section, the credits and the music button, with no menu or embedded map", () => {
    const { container } = render(<SiteRenderer site={sampleSite(cinematic(key))} mode="public" imageUrl={() => null} />);
    expect(container.querySelector(`.olv-ci[data-theme="${key}"]`)).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Zayn.*Nora/);
    expect(screen.getByRole("button", { name: "Tap to open the invitation" })).toBeInTheDocument();
    for (const id of ["countdown", "welcome", "story", "events", "wedding-party", "venue", "travel", "dress-code", "rsvp", "faq"])
      expect(container.querySelector(`[id=${id}][data-section]`), id).not.toBeNull();
    expect(container.querySelector("#gallery")).toBeNull(); // no photos yet: guests don't see an empty gallery
    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelector("iframe, video")).toBeNull();
    expect(screen.getByRole("button", { name: /(Play|Pause) music/ })).toBeInTheDocument();
    expect(container.querySelector("#rsvp form.olv-rsvp")).toHaveAttribute("data-mode", "try"); // a sample: the try-it form
    expect(screen.getByText("Starring")).toBeInTheDocument();
    expect(screen.getByText("Regards from Olava Invites")).toBeInTheDocument();
  });

  it("in the editor: no title card, the opening shown in its final state, and the look-only RSVP form", () => {
    const { container } = render(<SiteRenderer site={sampleSite(cinematic(key))} mode="edit" imageUrl={() => null} edit={{ selected: null, onSelect: vi.fn() }} />);
    expect(container.querySelector("[data-olava-intro]")).toBeNull();
    expect(container.querySelector(".ci-page")).toHaveClass("ready-to-open", "is-entered");
    expect(container.querySelector("#rsvp form.olv-rsvp")).toHaveAttribute("data-mode", "edit");
    expect(container.querySelector("#gallery")).not.toBeNull(); // the gallery to fill in
  });
});

describe("Cinematic design details", () => {
  it("shows the dress-code colour swatches, the events' Time and Place labels and the footer credit labels the host set", () => {
    const site = sampleSite(cinematic("noor"));
    const footer = site.sections.find((s) => s.key === "footer");
    if (footer) footer.content = { ...footer.content, starringLabel: "Featuring tonight" };
    const { container } = render(<SiteRenderer site={site} mode="public" imageUrl={() => null} />);
    expect(container.querySelectorAll("#dress-code .pal-swatches i").length).toBeGreaterThan(0);
    expect(container.querySelector("#events")?.textContent).toMatch(/Time.*Place/);
    if (footer) expect(screen.getByText("Featuring tonight")).toBeInTheDocument();
  });

  it("the other designs show the dress-code swatches too", () => {
    const { container } = render(<SiteRenderer site={sampleSite(rani)} mode="public" imageUrl={() => null} />);
    expect(container.querySelectorAll(".olv-swatches i").length).toBeGreaterThan(0);
  });

  it("the stills viewer opens a photo, moves with the arrows and closes with Escape, returning focus", async () => {
    const { Stills } = await import("@/templates/designs/cinematic/Stills");
    const { fireEvent } = await import("@testing-library/react");
    render(<Stills stills={[1, 2, 3].map((n) => ({ src: `/p${n}.jpg`, alt: `Photo ${n}` }))} interactive />);
    const first = screen.getByRole("button", { name: "Open photo 1 of 3: Photo 1" });
    fireEvent.click(first);
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(screen.getByText("03 / 03")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(first).toHaveFocus();
  });
});
