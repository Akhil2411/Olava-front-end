import { describe, expect, it } from "vitest";
import type { Palette, Template } from "@/lib/api/types";
import { withTemplate } from "@/templates/draft";
import { site } from "../fixtures";

const palette = (key: string): Palette => ({ key, name: key, background: "#fff", surface: "#fff", accent: "#a54b77", text: "#222", muted: "#555" });
const font = (key: string) => ({ key, name: key, heading: "Cormorant Garamond", body: "Inter" });
const target = (over: Partial<Template> = {}): Template => ({
  key: "rani-gold", name: "Rani & Gold", description: null, category: "Modern Indian", isPremium: true, versionNumber: 3,
  layout: "modern-indian", tier: null, sections: ["hero"], palettes: [palette("rani"), palette("blush")], fonts: [font("playfair")],
  defaultPalette: "rani", defaultFont: "playfair", features: [], defaultSections: [], ...over,
});

describe("withTemplate (picker live preview)", () => {
  it("renders the saved draft in the new template, keeping every section", () => {
    const draft = site();
    const out = withTemplate(draft, target());
    expect(out.template).toEqual({ key: "rani-gold", name: "Rani & Gold", versionNumber: 3, layout: "modern-indian" });
    expect(out.sections).toBe(draft.sections);
    expect(out.events).toBe(draft.events);
  });

  it("keeps the current palette/font when offered, otherwise uses the template defaults (like the API)", () => {
    const out = withTemplate(site(), target());
    expect(out.theme.palette.key).toBe("blush");
    expect(out.theme.font.key).toBe("playfair");
    expect(withTemplate(site(), target({ palettes: [palette("rani")] })).theme.palette.key).toBe("rani");
  });

  it("drops music when the template doesn't offer it", () => {
    const music = { track: "raga" as const, audio: null, icon: "note" as const, color: null, position: "bottom-right" as const };
    expect(withTemplate(site({ music }), target()).music).toBeNull();
    expect(withTemplate(site({ music }), target({ features: ["music"] })).music).toBe(music);
  });
});
