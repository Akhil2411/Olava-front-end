import type { SiteModel, SiteSection } from "@/lib/api/types";

export const t = (text: string | null, hidden = false) => ({ text, hidden });
export const section = (id: string | null, key: SiteSection["key"], content: Record<string, unknown>, layoutVariant: string | null = null): SiteSection =>
  ({ id, key, layoutVariant, content });

export function site(overrides: Partial<SiteModel> = {}): SiteModel {
  return {
    couple: { title: "Priya & Arjun", partnerOneName: "Priya", partnerTwoName: "Arjun", weddingDate: "2027-02-14", timeZoneId: "Asia/Kolkata", language: "en" },
    template: { key: "blush-garden", name: "Blush Garden", versionNumber: 1, layout: "arch" },
    theme: {
      palette: { key: "blush", name: "Blush", background: "#fdeaf1", surface: "#fff7fa", accent: "#a54b77", text: "#4a2a3a", muted: "#7a5a6a" },
      font: { key: "cormorant", name: "Classic", heading: "Cormorant Garamond", body: "Inter" },
    },
    sections: [
      section("s-hero", "hero", { eyebrow: t("Together"), tagline: t("invite you"), joiner: t("&"), image: { ref: null, width: null, height: null, hidden: false } }),
      section("s-story", "story", { eyebrow: t("Our story"), heading: t("How we met"), body: t("<script>alert(1)</script> At college.") }),
      section("s-events", "events", { eyebrow: t("Join us"), heading: t("Celebrations"), intro: t(null) }),
      section("s-gallery", "gallery", { eyebrow: t("Gallery"), heading: t("Moments"), intro: t(null) }),
      section("s-faq", "faq", { eyebrow: t("FAQ"), heading: t("FAQ"), items: [] }),
      section("s-rsvp", "rsvp", { eyebrow: t("RSVP"), heading: t("RSVP"), intro: t(null) }),
      section("s-footer", "footer", { line: t(null), badge: t("Regards from Olava Invites") }),
    ],
    events: [{
      name: "Wedding ceremony", eventType: "Ceremony", description: null, startsAt: "2027-02-14T11:00:00Z", endsAt: null,
      startsAtLocal: "2027-02-14T16:30", endsAtLocal: null, dressCode: "Pastels", notes: null,
      venue: { name: "The Garden Palace", addressLine: null, city: "Kochi", state: null, postalCode: null, mapUrl: "https://maps.example/x" }, cover: null,
    }],
    gallery: [{ ref: "abc123", width: 2000, height: 1333, caption: "First trip" }],
    rsvp: { enabled: true, deadline: null, allowUndecided: true, maxPlusOnes: 2, collectMessage: true, isOpen: true },
    contact: null,
    generatedAt: "2026-10-16T00:00:00Z",
    ...overrides,
  };
}
