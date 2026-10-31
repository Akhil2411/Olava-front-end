import type { CSSProperties } from "react";
import type { SiteModel } from "@/lib/api/types";

/** Template fonts map to self-hosted families loaded in the root layout. */
const FONT_STACKS: Record<string, string> = {
  "Cormorant Garamond": "'Cormorant Garamond', Georgia, serif",
  "Playfair Display": "'Playfair Display Variable', Georgia, serif",
  Inter: "'Inter Variable', system-ui, sans-serif",
};

const HEX = /^#[0-9a-f]{6}$/i;
const safe = (value: string, fallback: string) => (HEX.test(value) ? value : fallback);

/** Theme values from the API become CSS variables (validated hex only: no CSS injection). */
export function themeStyle(site: SiteModel): CSSProperties {
  const p = site.theme.palette;
  return {
    "--s-bg": safe(p.background, "#fff4f7"),
    "--s-surface": safe(p.surface, "#ffffff"),
    "--s-accent": safe(p.accent, "#b0507f"),
    "--s-text": safe(p.text, "#2b1f25"),
    "--s-muted": safe(p.muted, "#6f5b65"),
    "--s-heading": FONT_STACKS[site.theme.font.heading] ?? FONT_STACKS["Cormorant Garamond"],
    "--s-body": FONT_STACKS[site.theme.font.body] ?? FONT_STACKS.Inter,
  } as CSSProperties;
}
