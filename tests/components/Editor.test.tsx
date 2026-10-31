import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Media, Section, SectionTypeInfo } from "@/lib/api/types";
import { EditorContext, type EditorEnv } from "@/features/editor/context";
import { SectionForm, draftIssue } from "@/features/editor/SectionForm";
import { SectionsPanel } from "@/features/editor/SectionsPanel";
import { toSiteContent } from "@/templates/draft";

vi.mock("@/features/gallery/actions", () => ({
  uploadMediaAction: vi.fn(), updateCaptionAction: vi.fn(), reorderGalleryAction: vi.fn(), deleteMediaAction: vi.fn(),
}));

const t = (text: string | null, hidden = false) => ({ text, hidden });
const media: Media[] = [
  { id: "11111111-1111-1111-1111-111111111111", purpose: "Gallery", contentType: "image/webp", sizeBytes: 1, width: 800, height: 600, caption: "Beach", sortOrder: 0, createdAt: "" } as Media,
];
const env = (over: Partial<EditorEnv> = {}): EditorEnv => ({
  weddingId: "00000000-0000-0000-0000-000000000001", media, readOnly: false, onUploaded: vi.fn(), focusField: null, ...over,
});

function section(over: Partial<Section>): Section {
  return {
    id: crypto.randomUUID(), type: "story", label: "Our story", isRequired: false, isSingleton: false, isPinnedLast: false,
    isEnabled: true, sortOrder: 0, layoutVariant: null, layoutVariants: [], content: {}, revision: 1, disableWarning: null, ...over,
  };
}

describe("draft → preview content", () => {
  it("resolves media references like the API does (missing photos become empty)", () => {
    const out = toSiteContent({
      image: { mediaId: media[0].id, alt: "x", hidden: false },
      blocks: [{ type: "gallery", mediaIds: [media[0].id, "22222222-2222-2222-2222-222222222222"] }, { type: "image", mediaId: "gone" }],
    }, new Map(media.map((m) => [m.id, m]))) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(out.image).toEqual({ ref: media[0].id, width: 800, height: 600, alt: "x", hidden: false });
    expect(out.blocks[0].images).toEqual([{ ref: media[0].id, width: 800, height: 600, caption: "Beach" }]);
    expect(out.blocks[0].mediaIds).toBeUndefined();
    expect(out.blocks[1].ref).toBeNull();
  });
});

describe("autosave guard", () => {
  it("holds back saves the API would reject, with a helpful reason", () => {
    expect(draftIssue(section({ type: "custom", content: { blocks: [{ id: "b1", type: "text", text: " ", hidden: false }] } }))).toMatch(/empty/);
    expect(draftIssue(section({ type: "custom", content: { blocks: [{ id: "b1", type: "button", label: "Go", url: "javascript:alert(1)", hidden: false }] } }))).toMatch(/valid link/);
    expect(draftIssue(section({ type: "custom", content: { blocks: [{ id: "b1", type: "video", url: "https://evil.example/x", provider: null, videoId: null, title: null, hidden: false }] } }))).toMatch(/YouTube or Vimeo/);
    expect(draftIssue(section({ type: "registry", content: { links: [{ label: "Gifts", url: "http://x.com", description: null }] } }))).toMatch(/https/);
    expect(draftIssue(section({ type: "custom", content: { blocks: [{ id: "b1", type: "button", label: "Mail", url: "mailto:a@b.com", hidden: false }] } }))).toBeNull();
    expect(draftIssue(section({ type: "story", content: { heading: t("Hi") } }))).toBeNull();
  });
});

describe("SectionsPanel", () => {
  const sections = [
    section({ type: "hero", label: "Welcome", isRequired: true, isSingleton: true }),
    section({ type: "story", label: "Our story", content: { heading: t("How we met") } }),
    section({ type: "rsvp", label: "RSVP", isSingleton: true, disableWarning: "Guests will not be able to RSVP." }),
    section({ type: "footer", label: "Footer", isRequired: true, isSingleton: true, isPinnedLast: true }),
  ];
  const library: SectionTypeInfo[] = [
    { type: "faq", label: "FAQ", description: "Questions", isSingleton: false, canAdd: true },
    { type: "rsvp", label: "RSVP", description: "Replies", isSingleton: true, canAdd: false },
  ];
  const setup = () => {
    const props = { onOpen: vi.fn(), onToggle: vi.fn(), onDelete: vi.fn(async () => ({ ok: true })), onReorder: vi.fn(), onAdd: vi.fn(async () => ({ ok: true })) };
    render(<EditorContext.Provider value={env()}><SectionsPanel sections={sections} library={library} states={{}} {...props} /></EditorContext.Provider>);
    return props;
  };

  it("reorders with arrows, toggles visibility and keeps required sections and the footer fixed", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Move Our story, How we met down" }));
    expect(p.onReorder).toHaveBeenCalledWith([sections[0].id, sections[2].id, sections[1].id]);
    fireEvent.click(screen.getByRole("switch", { name: "Show RSVP on the website" }));
    expect(p.onToggle).toHaveBeenCalledWith(sections[2].id, false);
    expect(screen.queryByRole("switch", { name: /Welcome/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Delete Welcome/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /reorder Footer/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Drag to reorder Our story, How we met" })).toBeInTheDocument();
  });

  it("asks for confirmation before deleting and shows the section's warning", async () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Delete RSVP" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Guests will not be able to RSVP.")).toBeInTheDocument();
    expect(p.onDelete).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete section" }));
    await vi.waitFor(() => expect(p.onDelete).toHaveBeenCalledWith(sections[2].id));
  });

  it("offers the library and disables one-per-site sections that already exist", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "＋ Add section" }));
    expect(screen.getByRole("button", { name: /FAQ/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /RSVP\s*Already on your website/ })).toBeDisabled();
  });
});

describe("SectionForm", () => {
  it("edits and hides text elements in place", () => {
    const onContent = vi.fn();
    const s = section({ content: { eyebrow: t("Our story"), heading: t("Our story"), body: t(null), image: { mediaId: null, alt: null, hidden: false } } });
    render(<EditorContext.Provider value={env()}><SectionForm section={s} onContent={onContent} onLayout={vi.fn()} /></EditorContext.Provider>);
    fireEvent.change(screen.getByLabelText(/^Heading/), { target: { value: "How we met" } });
    expect(onContent).toHaveBeenLastCalledWith(expect.objectContaining({ heading: { text: "How we met", hidden: false } }));
    fireEvent.click(screen.getByRole("switch", { name: "Show small label" }));
    expect(onContent).toHaveBeenLastCalledWith(expect.objectContaining({ eyebrow: { text: "Our story", hidden: true } }));
  });

  it("edits the footer note (older footers with the on/off switch are upgraded on the first change)", () => {
    const onContent = vi.fn();
    const s = section({ type: "footer", label: "Footer", content: { line: t(null), showBadge: false } });
    render(<EditorContext.Provider value={env()}><SectionForm section={s} onContent={onContent} onLayout={vi.fn()} /></EditorContext.Provider>);
    expect(screen.getByLabelText(/^Footer note/)).toHaveValue("Regards from Olava Invites");
    expect(screen.getByRole("switch", { name: "Show footer note" })).not.toBeChecked();
    fireEvent.change(screen.getByLabelText(/^Footer note/), { target: { value: "With love, the Nairs" } });
    const saved = onContent.mock.lastCall![0];
    expect(saved.badge).toEqual({ text: "With love, the Nairs", hidden: true });
    expect(saved).not.toHaveProperty("showBadge");
  });

  it("adds, reorders and deletes custom blocks", () => {
    const onContent = vi.fn();
    const s = section({ type: "custom", label: "Custom section", content: { eyebrow: t(null, true), heading: t("Extras"), blocks: [
      { id: "aaaa1", type: "heading", text: "One", hidden: false },
      { id: "aaaa2", type: "text", text: "Two", hidden: false },
    ] } });
    render(<EditorContext.Provider value={env()}><SectionForm section={s} onContent={onContent} onLayout={vi.fn()} /></EditorContext.Provider>);
    fireEvent.click(screen.getByRole("button", { name: "Move Heading: One down" }));
    expect(onContent.mock.lastCall![0].blocks.map((b: { id: string }) => b.id)).toEqual(["aaaa2", "aaaa1"]);
    fireEvent.click(screen.getByRole("button", { name: "＋ Add block" }));
    fireEvent.click(screen.getByRole("button", { name: /^Map/ }));
    const added = onContent.mock.lastCall![0].blocks.at(-1);
    expect(added).toMatchObject({ type: "map", name: "", hidden: false });
    expect(added.id).toMatch(/^[A-Za-z0-9_-]{4,40}$/);
    fireEvent.click(screen.getAllByRole("button", { name: "Delete block" })[0]);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    expect(onContent.mock.lastCall![0].blocks.map((b: { id: string }) => b.id)).toEqual(["aaaa2"]);
  });
});
