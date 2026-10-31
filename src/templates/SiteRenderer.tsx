import type { ReactNode } from "react";
import type { SiteSection } from "@/lib/api/types";
import { themeStyle } from "./theme";
import type { LayoutKey, RenderContext } from "./types";
import { Contact, Countdown, Events, Faq, Footer, Gallery, Registry, Rsvp, Story, TextSection, VideoSection, WeddingParty } from "./sections/Basic";
import { Custom } from "./sections/Custom";
import { Hero } from "./sections/Hero";
import { DESIGNS } from "./designs/registry";
import { FitText } from "./FitText";
import { withSamples } from "./samples";

const LAYOUTS: LayoutKey[] = ["arch", "classic", "royal"];

const ANCHORS: Partial<Record<SiteSection["key"], string>> = {
  story: "story", events: "events", gallery: "gallery", rsvp: "rsvp", faq: "faq", travel: "travel",
  dress_code: "dress-code", thank_you: "thank-you", contact: "contact", wedding_party: "wedding-party",
  registry: "registry", video: "video", custom: "section",
};

/**
 * Renders a wedding site from the API's SiteModel (sections v2). Used by the private preview, the published
 * site, the template gallery (sample data) and the editor's live preview, so all of them always look the same.
 * Templates are platform-defined React code; customer content is plain text and data only.
 */
export function SiteRenderer(input: RenderContext) {
  // Editor and private preview: empty sections show sample content (tagged). Never on the live site.
  const ctx = input.mode === "edit" || input.mode === "preview" ? { ...input, site: withSamples(input.site) } : input;
  const Design = DESIGNS[ctx.site.template.layout];
  // FitText: long names (and other long words) scale down to fit instead of running off the screen.
  if (Design) return <>{Design(ctx)}<FitText /></>;
  return <><FallbackSite {...ctx} /><FitText /></>;
}

/** Simple built-in layout, used only for a template whose design isn't in the web app yet. */
function FallbackSite(ctx: RenderContext) {
  const { site } = ctx;
  const layout = (LAYOUTS.includes(site.template.layout as LayoutKey) ? site.template.layout : "classic") as LayoutKey;
  const footer = site.sections.find((s) => s.key === "footer") ?? null;
  const used = new Map<string, number>();

  const anchorFor = (section: SiteSection) => {
    const base = ANCHORS[section.key] ?? section.key;
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };

  const render = (section: SiteSection, index: number): ReactNode => {
    const key = section.id ?? `${section.key}-${index}`;
    const props = { ctx, section, anchor: anchorFor(section) };
    switch (section.key) {
      case "hero": return <Hero key={key} ctx={ctx} section={section} layout={layout} />;
      case "countdown": return <Countdown key={key} {...props} />;
      case "story": return <Story key={key} {...props} />;
      case "events": return <Events key={key} {...props} />;
      case "gallery": return <Gallery key={key} {...props} />;
      case "rsvp": return <Rsvp key={key} {...props} />;
      case "faq": return <Faq key={key} {...props} />;
      case "travel": return <TextSection key={key} {...props} name="Travel & stay" />;
      case "dress_code": return <TextSection key={key} {...props} name="Dress code" />;
      case "thank_you": return <TextSection key={key} {...props} name="Thank you" />;
      case "contact": return <Contact key={key} {...props} />;
      case "wedding_party": return <WeddingParty key={key} {...props} />;
      case "registry": return <Registry key={key} {...props} />;
      case "video": return <VideoSection key={key} {...props} />;
      case "custom": return <Custom key={key} {...props} />;
      default: return null; // footer renders last; unknown types are ignored
    }
  };

  return (
    <div
      style={themeStyle(site)}
      className="min-h-full bg-[var(--s-bg)] font-[family-name:var(--s-body)] text-[var(--s-text)] [&_h1]:font-normal [&_h2]:font-normal [&_h3]:font-normal"
      data-layout={layout}
    >
      {site.sections.map(render)}
      <Footer ctx={ctx} section={footer} />
    </div>
  );
}
