import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OlavaLoader } from "@/components/loading/OlavaLoader";
import { loaderStore, MIN_VISIBLE, SHOW_DELAY } from "@/components/loading/loaderStore";
import { SectionContent } from "@/components/loading/SectionLoading";
import { contrast, readableThemeColor } from "@/lib/utils/color";

vi.mock("next/link", () => ({ default: () => null, useLinkStatus: () => ({ pending: false }) }));

describe("OlavaLoader", () => {
  it("uses unique SVG ids per instance and only theme-derived colours", () => {
    const { container } = render(<><OlavaLoader /><OlavaLoader /></>);
    const ids = [...container.querySelectorAll("[id]")].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);                 // no clashes between the two loaders
    for (const ref of container.querySelectorAll("use")) {
      expect(ids).toContain(ref.getAttribute("href")!.slice(1)); // every reference points at its own instance
    }
    const html = container.innerHTML;
    expect(html).not.toMatch(/#a87c2a|#e3c477|#b98b33|#ece3cb/i); // the original gold/beige are gone
    expect(html).toContain("var(--loader-color");
    expect(container.querySelector("[data-part=empty]")!.getAttribute("style")).toContain("color-mix(in oklab, var(--loader-color");
  });

  it("is decorative by default (the surrounding status announces it) and can stand alone", () => {
    const { container, rerender } = render(<OlavaLoader />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<OlavaLoader decorative={false} />);
    expect(screen.getByRole("img", { name: "Loading" })).toBeInTheDocument();
  });
});

describe("section loader timing", () => {
  beforeEach(() => { vi.useFakeTimers(); loaderStore.reset(); });
  afterEach(() => { vi.useRealTimers(); loaderStore.reset(); });

  it("shows nothing when the section is ready within 200 ms", () => {
    loaderStore.begin();
    vi.advanceTimersByTime(SHOW_DELAY - 10);
    loaderStore.end();
    vi.advanceTimersByTime(1000);
    expect(loaderStore.get()).toBe(false);
  });

  it("appears after 200 ms, keeps running while loading and stays at least 400 ms", () => {
    loaderStore.begin();
    vi.advanceTimersByTime(SHOW_DELAY);
    expect(loaderStore.get()).toBe(true);
    vi.advanceTimersByTime(100);
    loaderStore.end();                              // ready after 100 ms of loader
    vi.advanceTimersByTime(MIN_VISIBLE - 100 - 1);
    expect(loaderStore.get()).toBe(true);           // held to avoid a flash
    vi.advanceTimersByTime(1);
    expect(loaderStore.get()).toBe(false);
  });

  it("stays visible for as long as navigation takes, and through back-to-back navigations", () => {
    loaderStore.begin();
    vi.advanceTimersByTime(3000);
    expect(loaderStore.get()).toBe(true);
    loaderStore.begin();                            // another tab tapped while loading
    loaderStore.end();
    vi.advanceTimersByTime(2000);
    expect(loaderStore.get()).toBe(true);
    loaderStore.end();
    vi.advanceTimersByTime(0);
    expect(loaderStore.get()).toBe(false);          // already shown > 400 ms: hides as soon as ready
  });

  it("announces once, covers only the content area and keeps the old section in place", () => {
    render(<SectionContent><h2>Wedding details</h2></SectionContent>);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    act(() => { loaderStore.begin(); vi.advanceTimersByTime(SHOW_DELAY); });
    expect(screen.getByRole("status")).toHaveTextContent("Loading section…");
    expect(screen.getByTestId("section-loader")).toHaveAttribute("aria-hidden", "true");
    const content = screen.getByText("Wedding details").parentElement!;
    expect(content).toHaveAttribute("aria-busy", "true");   // still rendered underneath: no layout shift
    expect(content).toHaveAttribute("inert");
    act(() => { loaderStore.end(); vi.advanceTimersByTime(MIN_VISIBLE); });
    expect(screen.queryByTestId("section-loader")).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("theme colour for the loader", () => {
  const palettes = {
    blush: { accent: "#a54b77", background: "#fdeaf1", text: "#4a2a3a" },
    ivory: { accent: "#8a6520", background: "#fbf6ea", text: "#3a2f1e" },
    maroon: { accent: "#f0cf8a", background: "#7a2b45", text: "#fff3e0" },   // light gold accent
    midnight: { accent: "#e8c6d8", background: "#2b2433", text: "#f6ecf2" },
  };
  it("uses the template accent, or its darker palette colour when the accent is too light for the dashboard", () => {
    expect(readableThemeColor(palettes.blush)).toBe("#a54b77");
    expect(readableThemeColor(palettes.ivory)).toBe("#8a6520");
    expect(readableThemeColor(palettes.maroon)).toBe("#7a2b45");
    expect(readableThemeColor(palettes.midnight)).toBe("#2b2433");
    expect(readableThemeColor(null)).toBe("#b0507f");
    for (const p of Object.values(palettes)) expect(contrast(readableThemeColor(p), "#fff4f7")).toBeGreaterThanOrEqual(3);
  });
});
