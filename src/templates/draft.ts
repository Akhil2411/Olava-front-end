import type { Media, Section, SiteImage, SiteModel, SiteSection, Template } from "@/lib/api/types";

/**
 * Client-side twin of the API's SiteContent.Transform (preview mode): turns a draft section into render form
 * so the editor's live preview updates on every keystroke without a round trip. Every `mediaId` becomes
 * `ref/width/height`, every `mediaIds` list becomes `images`, `videoMediaId`/`posterMediaId` become `video`/`poster`;
 * hidden elements are kept (the editor shows them
 * as placeholders). The server builds the real published snapshot, so this only affects what the host sees.
 */
export function toSiteContent(content: unknown, media: Map<string, Media>): unknown {
  if (Array.isArray(content)) return content.map((c) => toSiteContent(c, media));
  if (typeof content !== "object" || content === null) return content;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(content)) {
    if (key === "mediaId") {
      const m = typeof value === "string" ? media.get(value) : undefined;
      out.ref = m ? m.id : null;
      out.width = m?.width ?? null;
      out.height = m?.height ?? null;
    } else if (key === "videoMediaId") {
      const m = typeof value === "string" ? media.get(value) : undefined;
      out.video = m && m.purpose === "Video" ? { ref: m.id, contentType: m.contentType } : null;
    } else if (key === "posterMediaId") {
      const m = typeof value === "string" ? media.get(value) : undefined;
      out.poster = m && m.purpose !== "Video" ? { ref: m.id, width: m.width, height: m.height } : null;
    } else if (key === "mediaIds" && Array.isArray(value)) {
      out.images = value.map((id) => (typeof id === "string" ? media.get(id) : undefined)).filter(Boolean)
        .map((m) => ({ ref: m!.id, width: m!.width, height: m!.height, caption: m!.caption }));
    } else {
      out[key] = toSiteContent(value, media);
    }
  }
  return out;
}

export function toSiteSection(section: Section, media: Map<string, Media>): SiteSection {
  return { id: section.id, key: section.type, layoutVariant: section.layoutVariant, content: toSiteContent(section.content, media) as Record<string, unknown> };
}

/** The server preview with the editor's current (unsaved or saved) sections swapped in. */
export function withDraftSections(preview: SiteModel, sections: Section[], media: Media[]): SiteModel {
  const byId = new Map(media.map((m) => [m.id, m]));
  const gallery: SiteImage[] = media.filter((m) => m.purpose === "Gallery").sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({ ref: m.id, width: m.width, height: m.height, caption: m.caption }));
  const enabled = sections.filter((s) => s.isEnabled);
  const rsvp = enabled.find((s) => s.type === "rsvp");
  const rsvpContent = (rsvp?.content ?? {}) as Record<string, unknown>;
  return {
    ...preview,
    sections: enabled.map((s) => toSiteSection(s, byId)),
    gallery: enabled.some((s) => s.type === "gallery") ? gallery : [],
    rsvp: {
      ...preview.rsvp,
      enabled: !!rsvp,
      deadline: typeof rsvpContent.deadline === "string" ? rsvpContent.deadline : null,
      allowUndecided: rsvpContent.allowUndecided !== false,
      maxPlusOnes: typeof rsvpContent.maxPlusOnes === "number" ? rsvpContent.maxPlusOnes : 1,
      collectMessage: rsvpContent.collectMessage !== false,
    },
  };
}

/**
 * The saved draft as it would look after switching to `template`, for the picker's "Live preview" (nothing is
 * saved). Mirrors the API's design switch (TemplateApplier): the current palette and font are kept when the new
 * template offers them, otherwise its defaults apply; every section stays, since every layout renders every type.
 */
export function withTemplate(site: SiteModel, template: Template): SiteModel {
  const palette = template.palettes.find((p) => p.key === site.theme.palette.key)
    ?? template.palettes.find((p) => p.key === template.defaultPalette) ?? template.palettes[0];
  const font = template.fonts.find((f) => f.key === site.theme.font.key)
    ?? template.fonts.find((f) => f.key === template.defaultFont) ?? template.fonts[0];
  return {
    ...site,
    template: { key: template.key, name: template.name, versionNumber: template.versionNumber, layout: template.layout },
    theme: { palette: palette ?? site.theme.palette, font: font ?? site.theme.font },
    music: template.features.includes("music") ? site.music : null,
  };
}
