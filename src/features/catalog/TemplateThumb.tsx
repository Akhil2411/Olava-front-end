import type { Template } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { THUMBS } from "@/templates/designs/thumbs.generated";

/**
 * Template thumbnail: an uploaded image, a screenshot of the design (tools/capture-thumbnails.mjs), or, until one is captured,
 * a small invitation card drawn from the template's palette.
 */
export function TemplateThumb({ template, className }: { template: Template; className?: string }) {
  // An uploaded thumbnail (Admin → Templates) wins; a template added for an existing colour theme uses that theme's screenshot.
  const shot = template.previewImageUrl ?? THUMBS[template.key] ?? THUMBS[template.defaultPalette];
  if (shot) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={shot} alt="" aria-hidden="true" loading="lazy" width={585} height={780}
        className={cn("aspect-[3/4] w-full rounded-[18px] object-cover object-top", className)} />
    );
  }
  const p = template.palettes.find((x) => x.key === template.defaultPalette) ?? template.palettes[0];
  const font = template.fonts.find((f) => f.key === template.defaultFont)?.heading ?? "Cormorant Garamond";
  const heading = font === "Playfair Display" ? "'Playfair Display Variable', serif" : "'Cormorant Garamond', serif";
  const frame = template.layout === "arch" ? "rounded-t-[999px] rounded-b-xl" : template.layout === "royal" ? "rounded-2xl" : "rounded-none";
  return (
    <div className={cn("@container relative flex aspect-[3/4] flex-col items-center justify-center gap-[2cqw] overflow-hidden rounded-[18px] p-[8cqw] text-center", className)}
      style={{ background: p?.background, color: p?.text }} aria-hidden="true">
      <div className={cn("absolute inset-[5cqw] border opacity-40", frame)} style={{ borderColor: p?.accent }} />
      <span className="whitespace-nowrap text-[3.6cqw] uppercase tracking-[0.2em]" style={{ color: p?.accent }}>The wedding of</span>
      <span className="whitespace-nowrap text-[15cqw] italic leading-none" style={{ color: p?.accent, fontFamily: heading }}>A &amp; R</span>
      <span className="my-[1.5cqw] w-[14cqw] border-t opacity-50" style={{ borderColor: "currentColor" }} />
      <span className="whitespace-nowrap text-[9cqw] leading-tight" style={{ fontFamily: heading }}>Aisha · Rohan</span>
      <span className="whitespace-nowrap text-[3.6cqw] uppercase tracking-[0.2em]">14 · 02 · 2027</span>
    </div>
  );
}
