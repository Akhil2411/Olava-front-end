import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteRenderer } from "@/templates/SiteRenderer";
import { themeStyle } from "@/templates/theme";
import { section, site, t } from "../fixtures";

const img = (i: { ref: string }, v: string) => `/img/${i.ref}/${v}`;

describe("SiteRenderer", () => {
  it("renders sections in the configured order with real wedding data", () => {
    const { container } = render(<SiteRenderer site={site()} mode="public" imageUrl={img} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Priya&Arjun");
    const ids = [...container.querySelectorAll("section[id], header[id]")].map((e) => e.id);
    expect(ids).toEqual(["top", "story", "events", "gallery", "rsvp"]); // empty FAQ hidden on the public site
    expect(screen.getByRole("link", { name: /Get directions/ })).toHaveAttribute("href", "https://maps.example/x");
    expect(screen.getByRole("img", { name: "First trip" })).toHaveAttribute("src", "/img/abc123/thumb");
    expect(screen.getByText("Our story")).toBeInTheDocument(); // the eyebrow label is content now
    expect(screen.getByText("Regards from Olava Invites")).toBeInTheDocument();
  });

  it("renders customer content as text, never as HTML", () => {
    const { container } = render(<SiteRenderer site={site()} mode="public" imageUrl={() => null} />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(/<script>alert\(1\)<\/script> At college\./)).toBeInTheDocument();
  });

  it("omits hidden or empty elements on the site and uses the host's wording", () => {
    const s = site();
    s.sections[1] = section(null, "story", { eyebrow: t("Our story", true), heading: t(null), body: t("At college.") });
    s.sections[2] = section(null, "events", { eyebrow: t("Join us"), heading: t("Schedule"), intro: t(null), directionsLabel: "Find the venue" });
    s.sections[6] = section(null, "footer", { line: t("With love"), badge: t("Regards from Olava Invites", true) });
    render(<SiteRenderer site={s} mode="public" imageUrl={() => null} />);
    expect(screen.queryByText("Our story")).toBeNull();
    expect(screen.queryByRole("heading", { name: "How we met" })).toBeNull();
    expect(screen.getByRole("link", { name: /Find the venue/ })).toBeInTheDocument();
    expect(screen.getByText("With love")).toBeInTheDocument();
    expect(screen.queryByText("Regards from Olava Invites")).toBeNull();
  });

  it("in the editor, every element is tappable and hidden ones show as placeholders", () => {
    const onSelect = vi.fn();
    const s = site();
    s.sections[1] = section("s-story", "story", { eyebrow: t("Our story", true), heading: t("How we met"), body: t("At college.") });
    render(<SiteRenderer site={s} mode="edit" imageUrl={() => null} edit={{ selected: null, onSelect }} />);
    expect(screen.getByRole("button", { name: "Edit Small label (hidden)" })).toBeInTheDocument(); // the first: story's eyebrow
    fireEvent.click(screen.getAllByRole("button", { name: "Edit Heading" })[0]);
    expect(onSelect).toHaveBeenCalledWith({ sectionId: "s-story", field: "heading" });
    fireEvent.click(screen.getByRole("button", { name: "✎ Our story" }));
    expect(onSelect).toHaveBeenLastCalledWith({ sectionId: "s-story", field: "" });
    // Links never navigate inside the editor.
    expect(screen.queryByRole("link", { name: /Get directions/ })).toBeNull();
  });

  it("renders every custom block type and embeds only privacy-enhanced YouTube/Vimeo players", () => {
    const s = site();
    s.sections.splice(2, 0, section(null, "custom", {
      eyebrow: t(null, true), heading: t("Our ceremony"),
      blocks: [
        { id: "a1", type: "heading", text: "Rituals", hidden: false },
        { id: "a2", type: "text", text: "Haldi and pheras", hidden: false },
        { id: "a3", type: "image", ref: "img1", width: 10, height: 10, caption: "Haldi", alt: "Turmeric", hidden: false },
        { id: "a4", type: "gallery", images: [{ ref: "g1", width: 1, height: 1, caption: "One" }], hidden: false },
        { id: "a5", type: "video", provider: "youtube", videoId: "dQw4w9WgXcQ", title: "Our film", hidden: false },
        { id: "a6", type: "video", provider: "evil", videoId: "x", title: "Bad", hidden: false },
        { id: "a7", type: "button", label: "Email us", url: "mailto:us@example.com", hidden: false },
        { id: "a8", type: "button", label: "Bad link", url: "javascript:alert(1)", hidden: false },
        { id: "a9", type: "divider", hidden: false },
        { id: "b1", type: "map", name: "Bolgatty Palace", address: "Kochi", url: null, hidden: false },
        { id: "b2", type: "text", text: "Secret", hidden: true },
      ],
    }));
    const { container } = render(<SiteRenderer site={s} mode="public" imageUrl={img} />);
    expect(screen.getByRole("heading", { name: "Rituals" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Turmeric" })).toHaveAttribute("src", "/img/img1/large");
    expect(screen.getByRole("img", { name: "One" })).toBeInTheDocument();
    const frames = [...container.querySelectorAll("iframe")];
    expect(frames).toHaveLength(1);
    expect(frames[0].src).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
    expect(screen.getByRole("link", { name: "Email us" })).toHaveAttribute("href", "mailto:us@example.com");
    expect(screen.queryByText("Bad link")).toBeNull();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open in Maps/ })).toHaveAttribute("href", expect.stringContaining("google.com/maps/search"));
    expect(screen.queryByText("Secret")).toBeNull();
  });

  it("renders the wedding party and gift registry", () => {
    const s = site();
    s.sections.splice(2, 0,
      section(null, "wedding_party", { eyebrow: t("Wedding party"), heading: t("Our people"), intro: t(null), members: [{ name: "Ravi", role: "Best man", bio: null, ref: null }] }),
      section(null, "registry", { eyebrow: t("Gifts"), heading: t("Registry"), intro: t(null), links: [{ label: "Amazon", url: "https://example.com/r", description: null }, { label: "Bad", url: "http://x" }] }));
    render(<SiteRenderer site={s} mode="public" imageUrl={img} />);
    expect(screen.getByText("Best man")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Amazon/ })).toHaveAttribute("href", "https://example.com/r");
    expect(screen.queryByText("Bad")).toBeNull();
  });

  it("shows the real RSVP form to try in the private preview (nothing is sent)", async () => {
    render(<SiteRenderer site={site()} mode="preview" imageUrl={() => null} />);
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Your name"), "Meera");
    await userEvent.click(screen.getByLabelText("Joyfully accept"));
    await userEvent.click(screen.getByRole("button", { name: "Send RSVP" }));
    expect(screen.getByRole("status")).toHaveTextContent("This is a preview, so your reply wasn't sent.");
  });

  it("shows the real RSVP form, look-only, in the editor", () => {
    const s = site();
    s.sections = s.sections.map((x, i) => ({ ...x, id: `s${i}` }));
    const { container } = render(<SiteRenderer site={s} mode="edit" imageUrl={() => null} edit={{ selected: null, onSelect: vi.fn() }} />);
    const form = container.querySelector("form.olv-rsvp")!;
    expect(form).toHaveAttribute("data-mode", "edit");
    expect(form).toHaveAttribute("inert");                         // can't be typed in or tabbed to
    expect(form.querySelectorAll("input:not([type=hidden])").length).toBeGreaterThan(3);
    expect(screen.getByText("Preview: guests can reply once your website is published.")).toBeInTheDocument();
  });

  it("shows the host's footer note, and reads older footers that only had the on/off switch", () => {
    const s = site();
    s.sections[6] = section(null, "footer", { line: t(null), badge: t("With love from the Nair family") });
    const { unmount } = render(<SiteRenderer site={s} mode="public" imageUrl={() => null} />);
    expect(screen.getByText("With love from the Nair family")).toBeInTheDocument();
    unmount();
    s.sections[6] = section(null, "footer", { line: t(null), showBadge: true });
    const second = render(<SiteRenderer site={s} mode="public" imageUrl={() => null} />);
    expect(screen.getByText("Regards from Olava Invites")).toBeInTheDocument();
    second.unmount();
    s.sections[6] = section(null, "footer", { line: t(null), showBadge: false });
    render(<SiteRenderer site={s} mode="public" imageUrl={() => null} />);
    expect(screen.queryByText("Regards from Olava Invites")).toBeNull();
  });

  it("shows RSVP closed when the deadline has passed", () => {
    render(<SiteRenderer site={site({ rsvp: { enabled: true, deadline: "2020-01-01", allowUndecided: true, maxPlusOnes: 0, collectMessage: false, isOpen: false } })} mode="public" imageUrl={() => null} />);
    expect(screen.getByText(/RSVPs are now closed/)).toBeInTheDocument();
  });

  it("accepts only hex colours from the theme (no CSS injection)", () => {
    const s = site();
    s.theme.palette.accent = "red; background:url(https://evil)";
    expect((themeStyle(s) as Record<string, string>)["--s-accent"]).toBe("#b0507f");
  });
});
