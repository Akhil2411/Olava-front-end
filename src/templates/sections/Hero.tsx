import type { SiteSection } from "@/lib/api/types";
import { formatDate } from "@/lib/utils/format";
import { bool, imageEl, textEl } from "../content";
import { Editable, SectionEditChip } from "../Editable";
import type { LayoutKey, RenderContext } from "../types";

/** The hero differs per layout; everything else is shared so content maps 1:1 between templates. */
export function Hero({ ctx, section, layout }: { ctx: RenderContext; section: SiteSection; layout: LayoutKey }) {
  const { couple, events } = ctx.site;
  const c = section.content;
  const eyebrow = textEl(c, "eyebrow");
  const tagline = textEl(c, "tagline");
  const joiner = textEl(c, "joiner");
  const img = imageEl(c);
  const image = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  const firstVenue = events.find((e) => e.venue)?.venue;
  const date = formatDate(couple.weddingDate);
  const showDate = !!date && !bool(c, "hideDate");
  const venueText = firstVenue ? [firstVenue.name, firstVenue.city].filter(Boolean).join(", ") : null;
  const showVenue = !!venueText && !bool(c, "hideVenue");

  const frame =
    layout === "arch" ? "rounded-t-[220px] rounded-b-2xl border border-[var(--s-accent)]"
    : layout === "classic" ? "border border-[var(--s-accent)] outline outline-1 outline-offset-[10px] outline-[var(--s-accent)]/60"
    : "rounded-[28px] border-2 border-[var(--s-accent)] [background-image:repeating-linear-gradient(45deg,transparent_0_14px,color-mix(in_srgb,var(--s-accent)_10%,transparent)_14px_15px)]";

  return (
    <header id="top" className="px-5 pb-12 pt-16 text-center sm:pt-20">
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <div className="mx-auto max-w-3xl">
        <Editable ctx={ctx} section={section} field="eyebrow" label="Opening line" show={!eyebrow.hidden && !!eyebrow.text} hidden={eyebrow.hidden}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--s-accent)]">{eyebrow.text}</p>
        </Editable>
        <div className={`relative mx-auto mt-6 max-w-xl px-6 py-14 sm:px-12 sm:py-20 ${frame}`}>
          {layout === "royal" ? <span aria-hidden="true" className="mb-6 block text-2xl text-[var(--s-accent)]">✦</span> : null}
          <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!image} hidden={img.hidden} className="mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic, authorised image URLs */}
            <img src={image ?? undefined} alt={img.alt ?? ""} className={`mx-auto mb-8 h-56 w-full max-w-sm object-cover ${layout === "arch" ? "rounded-t-full rounded-b-xl" : "rounded-xl"}`} />
          </Editable>
          <Editable ctx={ctx} section={section} field="names" label="Names" show>
            <h1 className="font-[family-name:var(--s-heading)] text-[clamp(44px,11vw,88px)] italic leading-[1.05] text-[var(--s-accent)]">
              {couple.partnerOneName}
              {!joiner.hidden && joiner.text ? <span className="my-2 block text-[0.42em] not-italic text-[var(--s-text)]">{joiner.text}</span> : <span className="sr-only"> and </span>}
              {couple.partnerTwoName}
            </h1>
          </Editable>
          <Editable ctx={ctx} section={section} field="tagline" label="Invitation line" show={!tagline.hidden && !!tagline.text} hidden={tagline.hidden} className="mt-6">
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--s-text)]">{tagline.text}</p>
          </Editable>
          <div className="mt-8 space-y-1 text-[var(--s-text)]">
            <Editable ctx={ctx} section={section} field="date" label="Date" show={showDate} hidden={!!date && bool(c, "hideDate")} placeholderWhenEmpty={false}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--s-accent)]">{date}</p>
            </Editable>
            <Editable ctx={ctx} section={section} field="venue" label="Venue" show={showVenue} hidden={!!venueText && bool(c, "hideVenue")} placeholderWhenEmpty={false}>
              <p className="text-sm text-[var(--s-muted)]">{venueText}</p>
            </Editable>
          </div>
        </div>
      </div>
    </header>
  );
}
