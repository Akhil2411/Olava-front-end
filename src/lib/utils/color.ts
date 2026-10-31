/** Small colour helpers (hex only) for picking a readable theme colour on the dashboard. */

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The template colour to draw dashboard accents (the loader) with. The dashboard background is light,
 * so a light accent (e.g. Royal Maroon's gold) falls back to the palette's darker background or text colour.
 * Needs at least 3:1 against the dashboard background (WCAG non-text contrast).
 */
export function readableThemeColor(
  palette: { accent: string; background: string; text: string } | null | undefined,
  surface = "#fff4f7",
  fallback = "#b0507f",
): string {
  if (!palette) return fallback;
  for (const candidate of [palette.accent, palette.background, palette.text]) {
    if (HEX.test(candidate) && contrast(candidate, surface) >= 3) return candidate;
  }
  return fallback;
}
