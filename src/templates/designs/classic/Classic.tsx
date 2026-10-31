import type { ReactNode } from "react";
import type { SiteSection } from "@/lib/api/types";
import { formatDate } from "@/lib/utils/format";
import { FOOTER_BADGE_DEFAULT, bool, footerBadge, imageEl, label as labelOf, list, rsvpLabels, safeHref, textEl } from "../../content";
import { Editable, SectionEditChip, SiteLink } from "../../Editable";
import { RsvpBlock } from "../../rsvp/RsvpBlock";
import { CustomBlocks, customIsEmpty } from "../../sections/Custom";
import { VideoBlockView, videoOf } from "../shared/VideoBlockView";
import type { RenderContext } from "../../types";
import { AddToCalendar } from "../shared/AddToCalendar";
import { DesignAssets } from "../shared/assets";
import { CountdownValue } from "../shared/Countdown";
import {
  calendarEvent, countdownTarget, dateOf, el, fileSlug, isEdit, mapsUrl, names, showPlaceholders, timeOf, uid, venueLine, venuesOf, weddingCalendar, weddingDay, eventsFor, venuesFor,
} from "../shared/data";
import { MapCard } from "../shared/MapCard";
import { Swatches } from "../shared/Swatches";
import { RevealObserver } from "../shared/Reveal";
import { Entrance } from "./Entrance";
import { Photos, type PhotoLayout, type Tile } from "./Photos";
import { EventList, FaqList } from "../shared/EventList";
import { chosenLayout } from "../shared/layouts";
import { PhotoGallery } from "../shared/PhotoGallery";

/**
 * The Classic collection (Standard tier): five designs that share this section kit. Each design supplies its
 * hero, its section headings, its placeholder artwork and, where the supplied design does something of its own
 * (Black Tie's Deco event cards, Heirloom's chapters, Riviera's day tabs), an override for that section type.
 * Every other section uses the generic markup below (`cl-*` classes, laid out by classic/css/base.css and
 * dressed by the design's own stylesheet). No music, no section menu (by decision).
 */

export type P = { ctx: RenderContext; section: SiteSection; anchor: string; kit: Kit; index: number };

/** What placeholder artwork a slot needs (until the couple adds photos). */
export type ArtKind = "story" | "gallery" | "person" | "plate" | "tile";

export interface Kit {
  /** Design (layout) key and its root class, e.g. "black-tie" / "olv-bt". */
  design: string;
  root: string;
  /** Section heading markup. */
  head: {
    wrapper?: string;          // class of the <header> (default "head")
    eyebrow?: string;          // class of the small label (default "cl-eyebrow")
    eyebrowAfter?: boolean;    // small label under the heading (Heirloom's chapter meta)
    ornament?: ReactNode;      // under the heading (Black Tie's ◆ ◆ ◆, Ivory's rule)
    intro?: string;            // class of the introduction paragraph (default "cl-intro")
    emph?: boolean;            // set the heading's last word in italic (Riviera)
  };
  /** Extra classes per section (light/dark bands, paper). Gets the position among shown sections. */
  tone?: (key: string, position: number) => string;
  /** Placeholder artwork as an SVG string (only our own generated markup). */
  art: (kind: ArtKind, i: number, id: string, ctx: RenderContext, text?: string) => string;
  gallery: PhotoLayout;
  Hero: (p: { ctx: RenderContext; section: SiteSection; kit: Kit; rsvp: SiteSection | null; events: SiteSection | null }) => ReactNode;
  /** Section types the design draws its own way. */
  sections?: Partial<Record<string, (p: P) => ReactNode>>;
  /** The whole section frame (Heirloom's chapters); default: <section> + heading + body. */
  Frame?: (p: FrameProps) => ReactNode;
  footerArt?: (ctx: RenderContext) => ReactNode;
  /** Opening animation length (the supplied design's introMs); 0 = none. */
  introMs: number;
  /** A full-screen overlay during the opening, with a skip button (Heirloom's crest). */
  Overlay?: (p: { ctx: RenderContext }) => ReactNode;
  /** Before the page (e.g. Riviera's info bar sits after the hero; designs can add their own pieces). */
  afterHero?: (ctx: RenderContext) => ReactNode;
  /** The hero is a side panel beside the scrolling sections (English Garden). */
  split?: boolean;
  /** Stylesheets of the design, besides classic/base.css. */
  css?: string[];
}

// ───────────── small building blocks ─────────────

/** "A weekend by the sea" → A weekend by <em>the sea</em> (the last word, or the last two when it's short). */
export function Emph({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  let cut = words.length - 1;
  const bare = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "");
  if (cut > 0 && bare(words[cut]).length <= 3) cut--;
  if (cut > 0 && /^(&|and)$/i.test(words[cut - 1])) cut--;
  if (cut === 0) cut = words.length - 1;
  return <>{words.slice(0, cut).join(" ")} <em>{words.slice(cut).join(" ")}</em></>;
}

const ROMAN: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
export function roman(n: number): string {
  let s = "";
  for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; }
  return s;
}
/** 30 · XI · MMXXVI */
export function romanDate(site: RenderContext["site"]): string | null {
  const d = site.couple.weddingDate;
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  return `${day} · ${roman(m)} · ${roman(y)}`;
}

export const initial = (s: string) => s.trim().slice(0, 1).toUpperCase();
export const placeOf = (ctx: RenderContext) => {
  const v = ctx.site.events.find((e) => e.venue)?.venue;
  return v ? (v.city ?? v.name) : null;
};

export type FrameProps = {
  ctx: RenderContext; section: SiteSection; anchor: string; kit: Kit; index: number;
  name: string; intro?: string | null; className?: string; children: ReactNode;
};

/** Small label, heading, ornament and introduction, each editable and hideable. */
export function Head({ ctx, section, anchor, kit, intro = "intro" }: Omit<FrameProps, "children" | "className" | "name" | "index">) {
  const h = kit.head;
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  const introEl = intro ? el(section, intro) : null;
  const eb = (
    <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
      <p className={h.eyebrow ?? "cl-eyebrow"}>{eyebrow.text}</p>
    </Editable>
  );
  return (
    <header className={`${h.wrapper ?? "head"} reveal`}>
      {h.eyebrowAfter ? null : eb}
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
        <h2 id={`${anchor}-title`}>{h.emph ? <Emph text={heading.text ?? ""} /> : heading.text}</h2>
      </Editable>
      {h.ornament ?? null}
      {h.eyebrowAfter ? eb : null}
      {introEl ? (
        <Editable ctx={ctx} section={section} field={intro!} label="Introduction" show={introEl.show} hidden={introEl.hidden}>
          <p className={h.intro ?? "cl-intro"}>{introEl.text}</p>
        </Editable>
      ) : null}
    </header>
  );
}

export function Frame(p: FrameProps) {
  if (p.kit.Frame) return <>{p.kit.Frame(p)}</>;
  const { ctx, section, anchor, kit, index, name, className, children } = p;
  const heading = el(section, "heading");
  const cls = ["sec", kit.tone?.(section.key, index), className].filter(Boolean).join(" ");
  return (
    <section id={anchor} className={cls} aria-labelledby={heading.show ? `${anchor}-title` : undefined} data-section={section.key}>
      <SectionEditChip ctx={ctx} section={section} name={name} />
      <Head ctx={ctx} section={section} anchor={anchor} kit={kit} intro={p.intro} />
      {children}
    </section>
  );
}

export const ArrowOut = () => <svg viewBox="0 0 24 24" aria-hidden="true" className="cl-ic"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;

export function SectionPhoto({ ctx, section, className = "cl-photo" }: { ctx: RenderContext; section: SiteSection; className?: string }) {
  const img = imageEl(section.content);
  const url = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  return (
    <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!url} hidden={img.hidden}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${className} reveal`} src={url ?? undefined} alt={img.alt ?? ""} loading="lazy" />
    </Editable>
  );
}

export function Links({ ctx, section }: { ctx: RenderContext; section: SiteSection }) {
  const links = list<{ label?: string; url?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (links.length === 0 && !isEdit(ctx)) return null;
  return (
    <Editable ctx={ctx} section={section} field="links" label="Buttons" show={links.length > 0}>
      <div className="cl-links reveal">
        {links.map((l, i) => <SiteLink key={i} ctx={ctx} href={safeHref(l.url)} className="btn">{l.label}</SiteLink>)}
      </div>
    </Editable>
  );
}

/** A photo or the design's placeholder artwork. */
export function Media({ src, alt, art }: { src: string | null; alt?: string | null; art: string }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt={alt ?? ""} loading="lazy" />
    : <span className="cl-art" dangerouslySetInnerHTML={{ __html: art }} />;
}

export function CalButton({ ctx, e, label, className = "cl-link" }: { ctx: RenderContext; e: RenderContext["site"]["events"][number]; label: string; className?: string }) {
  return (
    <AddToCalendar events={[calendarEvent(ctx.site, e)]} fileName={`${fileSlug(ctx.site)}-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      className={className} disabled={isEdit(ctx)}>
      {label}<span className="olv-sr">: {e.name}</span>
    </AddToCalendar>
  );
}

/** The time span of an event: "4:00 PM – 6:00 PM". */
export const timeSpan = (e: RenderContext["site"]["events"][number]) => {
  const end = e.endsAtLocal && e.endsAtLocal.slice(0, 10) === e.startsAtLocal.slice(0, 10) ? ` – ${timeOf(e.endsAtLocal)}` : "";
  return `${timeOf(e.startsAtLocal)}${end}`;
};

/** An event's cover photo (nothing when it has none: every design looks complete without one). */
export function EventCover({ ctx, e, className = "cl-cover" }: { ctx: RenderContext; e: RenderContext["site"]["events"][number]; className?: string }) {
  const url = e.cover ? ctx.imageUrl(e.cover, "large") : null;
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img className={className} src={url} alt="" loading="lazy" /> : null;
}

/** Events in one of the shared layouts the couple chose (cards, timeline, agenda). */
function SharedEvents(p: P) {
  const { ctx, section } = p;
  const layout = chosenLayout(section, "events", p.kit.design)!;
  return (
    <Frame {...p} name="Events">
      {eventsFor(ctx.site).length === 0 ? <NoEvents ctx={ctx} section={section} /> : <div className="cl-shared"><EventList ctx={ctx} section={section} layout={layout} /></div>}
    </Frame>
  );
}

// ───────────── generic sections ─────────────

function Countdown({ ctx, section, anchor, kit, index }: P) {
  const c = section.content;
  const target = countdownTarget(ctx.site);
  const heading = el(section, "heading");
  if (!target && ctx.mode === "public") return null;
  const units: [Parameters<typeof CountdownValue>[0]["unit"], string, string][] = [
    ["d", "daysUnit", "Days"], ["h", "hoursUnit", "Hours"], ["m", "minutesUnit", "Minutes"], ["s", "secondsUnit", "Seconds"],
  ];
  return (
    <section id={anchor} className={["cl-cd-wrap", kit.tone?.("countdown", index)].filter(Boolean).join(" ")} data-section="countdown"
      aria-label={heading.show ? heading.text! : "Countdown"}>
      <SectionEditChip ctx={ctx} section={section} name="Countdown" />
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
        <p className="cl-cd-title">{heading.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="labels" label="Countdown wording" show>
        {target ? (
          <div className="cl-countdown" role="timer" aria-label="Time until the wedding">
            {units.map(([u, key, fallback]) => (
              <div key={u}><b><CountdownValue target={target} unit={u} pad /></b><span>{labelOf(c, key, fallback)}</span></div>
            ))}
          </div>
        ) : <p className="cl-cd-title">Add your wedding date to start the countdown.</p>}
      </Editable>
    </section>
  );
}

function Welcome(p: P) {
  const { ctx, section } = p;
  const body = el(section, "body");
  const sign = el(section, "signature");
  if (!body.show && !sign.show && ctx.mode === "public" && !el(section, "heading").show) return null;
  return (
    <Frame {...p} name="Welcome note" intro={null}>
      <div className="cl-letter reveal">
        <Editable ctx={ctx} section={section} field="body" label="Letter" show={body.show} hidden={body.hidden}>
          <p className="cl-letter-body">{body.text}</p>
        </Editable>
        <Editable ctx={ctx} section={section} field="signature" label="Signature" show={sign.show} hidden={sign.hidden}>
          <p className="cl-sign">{sign.text}<span>{names(ctx.site)}</span></p>
        </Editable>
      </div>
      <SectionPhoto ctx={ctx} section={section} />
    </Frame>
  );
}

function SaveTheDate(p: P) {
  const { ctx, section } = p;
  const c = section.content;
  const note = el(section, "note");
  const day = weddingDay(ctx.site);
  const events = weddingCalendar(ctx.site);
  if (!day && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Save the date" intro={null}>
      <div className="cl-std reveal">
        <Editable ctx={ctx} section={section} field="note" label="Note" show={note.show} hidden={note.hidden}>
          <p className="cl-label">{note.text}</p>
        </Editable>
        {day ? (
          <>
            <p className="cl-std-date">{day.long}</p>
            <p className="cl-std-day">{day.weekday}{day.time ? ` · ${day.time}` : ""}</p>
          </>
        ) : <p className="cl-std-day">{showPlaceholders(ctx) ? "Add your wedding date" : ""}</p>}
        {events.length > 0 ? (
          <Editable ctx={ctx} section={section} field="buttonLabel" label="Button wording" show>
            <AddToCalendar events={events} fileName={`${fileSlug(ctx.site)}-wedding`} className="btn" disabled={isEdit(ctx)}>
              {labelOf(c, "buttonLabel", "Save the date")}
            </AddToCalendar>
          </Editable>
        ) : null}
      </div>
    </Frame>
  );
}

export type Chapter = { label?: string; title?: string; text?: string; ref?: string | null; alt?: string; colors?: string[] | null };
export const chaptersOf = (section: SiteSection) => list<Chapter>(section.content, "chapters").filter((ch) => ch.title);

/** Story: alternating picture-and-text rows with a numeral (the default; designs override it). */
function Story(p: P) {
  const { ctx, section, kit } = p;
  const body = el(section, "body");
  const chapters = chaptersOf(section);
  const img = imageEl(section.content);
  if (!body.show && chapters.length === 0 && !img.ref && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Our story" intro={chapters.length ? "body" : null}>
      {chapters.length === 0 ? <StoryText {...p} /> : (
        <div className="cl-story">
          {chapters.map((ch, i) => (
            <Editable key={i} ctx={ctx} section={section} field={`chapters.${i}`} label={`Chapter ${ch.title}`} show>
              <article className={`cl-chapter reveal${i % 2 ? " rev" : ""}`}>
                <div className="cl-pic">
                  <Media src={ch.ref ? ctx.imageUrl({ ref: ch.ref }, "large") : null} alt={ch.alt} art={kit.art("story", i, `${kit.root}-st-${uid(section, i)}`, ctx)} />
                </div>
                <div className="cl-txt">
                  <span className="cl-num" aria-hidden="true">{roman(i + 1)}</span>
                  {ch.label ? <p className="cl-label">{ch.label}</p> : null}
                  <h3>{ch.title}</h3>
                  {ch.text ? <p>{ch.text}</p> : null}
                </div>
              </article>
            </Editable>
          ))}
        </div>
      )}
    </Frame>
  );
}

/** A story without chapters: its photo and text. */
export function StoryText({ ctx, section }: P) {
  const body = el(section, "body");
  return (
    <>
      <SectionPhoto ctx={ctx} section={section} />
      <Editable ctx={ctx} section={section} field="body" label="Story text" show={body.show} hidden={body.hidden}>
        <p className="cl-prose reveal">{body.text}</p>
      </Editable>
      {isEdit(ctx) ? <Editable ctx={ctx} section={section} field="chapters" label="Chapters" show={false} /> : null}
    </>
  );
}

export function eventLabels(section: SiteSection) {
  const c = section.content;
  return {
    showCal: bool(c, "showCalendar", true),
    cal: labelOf(c, "calendarLabel", "Add to calendar"),
    dress: labelOf(c, "dressCodeLabel", "Dress code:"),
    empty: labelOf(c, "emptyText", "Event details are coming soon."),
  };
}

/** Events with nothing to show yet. */
export function NoEvents({ ctx, section }: { ctx: RenderContext; section: SiteSection }) {
  return (
    <Editable ctx={ctx} section={section} field="labels" label="Events wording" show>
      <p className="cl-prose">{eventLabels(section).empty}</p>
    </Editable>
  );
}

/** Events as cards (the default). */
function Events(p: P) {
  const { ctx, section } = p;
  const events = eventsFor(ctx.site);
  const l = eventLabels(section);
  return (
    <Frame {...p} name="Events">
      {events.length === 0 ? <NoEvents ctx={ctx} section={section} /> : (
        <div className="cl-events">
          {events.map((e, i) => (
            <Editable key={`${e.name}-${i}`} ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show>
              <article className="cl-event reveal">
                <EventCover ctx={ctx} e={e} />
                <p className="cl-label">{dateOf(e.startsAtLocal, { weekday: "short", day: "numeric", month: "short" })} · <time dateTime={e.startsAt}>{timeSpan(e)}</time></p>
                <h3>{e.name}</h3>
                {e.venue ? <p className="cl-place">{e.venue.name}{e.venue.city ? <><br />{e.venue.city}</> : null}</p> : null}
                {e.description || e.notes ? <p className="cl-desc">{[e.description, e.notes].filter(Boolean).join(" ")}</p> : null}
                {e.dressCode ? <p className="cl-small">{l.dress} {e.dressCode}</p> : null}
                {l.showCal ? <CalButton ctx={ctx} e={e} label={l.cal} /> : null}
              </article>
            </Editable>
          ))}
        </div>
      )}
    </Frame>
  );
}

/** Events as a programme with dotted leaders (Heirloom, Ivory Letterpress, English Garden). */
export function Programme(p: P & { withDate?: boolean }) {
  const { ctx, section } = p;
  const events = eventsFor(ctx.site);
  const l = eventLabels(section);
  const days = new Set(events.map((e) => e.startsAtLocal.slice(0, 10)));
  const many = days.size > 1;
  return (
    <Frame {...p} name="Events">
      {events.length === 0 ? <NoEvents ctx={ctx} section={section} /> : (
        <>
          <ol className="cl-programme programme reveal">
            {events.map((e, i) => (
              <li key={`${e.name}-${i}`}>
                <Editable ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show className="cl-prog-edit">
                  <span className="cl-prog">
                    <span className="t"><time dateTime={e.startsAt}>{many ? `${dateOf(e.startsAtLocal, { day: "numeric", month: "short" })} · ` : ""}{timeOf(e.startsAtLocal)}</time></span>
                    <span className="dots" aria-hidden="true" />
                    <span className="e">{e.name}
                      {e.venue || e.description ? <em>{[e.venue?.name, e.description].filter(Boolean).join(" · ")}</em> : null}
                      {e.dressCode ? <em>{l.dress} {e.dressCode}</em> : null}
                    </span>
                  </span>
                </Editable>
              </li>
            ))}
          </ol>
          {events.some((e) => e.cover) ? (
            <ul className="cl-prog-covers reveal">
              {events.map((e, i) => e.cover ? (
                <li key={i}>
                  <Editable ctx={ctx} section={section} field={`events.${i}.cover`} label={`Cover photo for ${e.name}`} show>
                    <EventCover ctx={ctx} e={e} />
                  </Editable>
                  <span>{e.name}</span>
                </li>
              ) : null)}
            </ul>
          ) : null}
          {l.showCal ? (
            <div className="cl-cal-row reveal">
              {events.map((e, i) => <CalButton key={i} ctx={ctx} e={e} label={events.length > 1 ? `${l.cal}: ${e.name}` : l.cal} className="btn" />)}
            </div>
          ) : null}
        </>
      )}
    </Frame>
  );
}

function Gallery(p: P) {
  const { ctx, section, kit } = p;
  const photos = ctx.site.gallery;
  if (photos.length === 0 && ctx.mode === "public") return null;
  const tiles: Tile[] = photos.length
    ? photos.map((ph) => ({ src: ctx.imageUrl(ph, "large") ?? undefined, alt: ph.caption ?? "" }))
    : Array.from({ length: kit.gallery === "film" ? 8 : 6 }, (_, i) => ({ alt: "", art: kit.art("gallery", i, `${kit.root}-g-${uid(section, i)}`, ctx) }));
  // The couple's layout choice: the Classic grid and masonry in this design's own style, or the shared carousel and filmstrip.
  const chosen = chosenLayout(section, "gallery", kit.design);
  const own: PhotoLayout | null = chosen === "photo-grid" ? "grid" : chosen === "photo-masonry" ? "masonry" : null;
  const interactive = !isEdit(ctx) && photos.length > 0;
  return (
    <Frame {...p} name="Gallery" className="gallery-sec">
      <Editable ctx={ctx} section={section} field="photos" label="Photos" show>
        {chosen && !own ? <div className="cl-shared"><PhotoGallery layout={chosen} tiles={tiles} interactive={interactive} className="reveal" /></div>
          : <Photos tiles={tiles} layout={own ?? kit.gallery} interactive={interactive} />}
      </Editable>
    </Frame>
  );
}

function Venue(p: P) {
  const { ctx, section, index } = p;
  const c = section.content;
  const venues = venuesFor(ctx.site);
  if (venues.length === 0 && ctx.mode === "public") return null;
  const label = labelOf(c, "directionsLabel", "Open in Maps");
  return (
    <Frame {...p} name="Venue">
      {venues.length === 0 ? (
        <Editable ctx={ctx} section={section} field="labels" label="Venue wording" show>
          <p className="cl-prose">{labelOf(c, "emptyText", "Add a venue to your events to show it here.")}</p>
        </Editable>
      ) : <VenueCards ctx={ctx} section={section} index={index} label={label} venues={venues} />}
    </Frame>
  );
}

export function VenueCards({ ctx, section, index, label, venues }: {
  ctx: RenderContext; section: SiteSection; index: number; label: string; venues: ReturnType<typeof venuesOf>;
}) {
  return (
    <div className={`cl-venues${venues.length > 1 ? " many" : ""}`}>
      {venues.map((v, i) => (
        <div key={i} className="reveal">
          <p className="cl-label">{v.events.join(" · ")}</p>
          <Editable ctx={ctx} section={section} field="directionsLabel" label="Map link wording" show>
            <MapCard ctx={ctx} href={mapsUrl(v)} name={v.name} address={venueLine(v)} label={label} id={`${uid(section, index)}-${i}`} />
          </Editable>
        </div>
      ))}
    </div>
  );
}

export type Item = { label?: string; title?: string; text?: string; url?: string; linkLabel?: string; ref?: string | null; alt?: string; colors?: string[] | null };

/** Travel, things to do, dress code and thank you: an introduction and a set of items. */
export function InfoSection(p: P & { name: string; variant?: string; icons?: (i: number) => ReactNode; artFor?: ArtKind }) {
  const { ctx, section, kit } = p;
  const body = el(section, "body");
  const items = list<Item>(section.content, "items").filter((i) => i.title);
  const img = imageEl(section.content);
  const links = list(section.content, "links");
  if (!body.show && items.length === 0 && !img.ref && links.length === 0 && ctx.mode === "public") return null;
  return (
    <Frame {...p} name={p.name} intro="body">
      <SectionPhoto ctx={ctx} section={section} />
      {items.length === 0 ? (isEdit(ctx) ? <Editable ctx={ctx} section={section} field="items" label="Items" show={false} /> : null) : (
        <div className={`cl-items ${p.variant ?? ""}`} data-count={items.length}>
          {items.map((item, i) => {
            const href = safeHref(item.url);
            const photo = item.ref ? ctx.imageUrl({ ref: item.ref }, "large") : null;
            return (
              <Editable key={i} ctx={ctx} section={section} field={`items.${i}`} label={`Item ${item.title}`} show>
                <div className="cl-item reveal">
                  {p.artFor || photo ? (
                    <div className="cl-item-img">
                      <Media src={photo} alt={item.alt} art={p.artFor ? kit.art(p.artFor, i, `${kit.root}-it-${uid(section, i)}`, ctx) : ""} />
                    </div>
                  ) : null}
                  {p.icons ? p.icons(i) : null}
                  <span className="cl-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  {item.label ? <p className="cl-label">{item.label}</p> : null}
                  <h3>{item.title}</h3>
                  <Swatches colors={item.colors} />
                  {item.text ? <p className="cl-item-text">{item.text}</p> : null}
                  {href ? <SiteLink ctx={ctx} href={href} className="cl-link">{item.linkLabel || "Find out more"}<ArrowOut /></SiteLink> : null}
                </div>
              </Editable>
            );
          })}
        </div>
      )}
      <Links ctx={ctx} section={section} />
    </Frame>
  );
}

function Faq(p: P) {
  const { ctx, section } = p;
  const items = list<{ question?: string; answer?: string }>(section.content, "items").filter((i) => i.question && i.answer);
  if (items.length === 0 && ctx.mode === "public") return null;
  const faqLayout = chosenLayout(section, "faq", p.kit.design);
  return (
    <Frame {...p} name="FAQ">
      {faqLayout ? <div className="cl-shared"><FaqList ctx={ctx} section={section} items={items} layout={faqLayout} /></div> : <Editable ctx={ctx} section={section} field="items" label="Questions" show={items.length > 0}>
        <div className="cl-faq faq reveal">
          {items.map((item, i) => (
            <details key={i} open={isEdit(ctx) || undefined}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </Editable>}
    </Frame>
  );
}

function Registry(p: P) {
  const { ctx, section } = p;
  const intro = el(section, "intro");
  const links = list<{ label?: string; url?: string; description?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (!intro.show && links.length === 0 && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Gift registry">
      {links.length || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="links" label="Registry links" show={links.length > 0}>
          <div className="cl-gifts" data-count={links.length}>
            {links.map((l, i) => (
              <SiteLink key={i} ctx={ctx} href={safeHref(l.url)} className="cl-gift reveal">
                <span className="cl-n" aria-hidden="true">{roman(i + 1)}</span>
                <h3>{l.label}</h3>
                {l.description ? <p>{l.description}</p> : null}
                <span className="cl-go" aria-hidden="true">›</span>
              </SiteLink>
            ))}
          </div>
        </Editable>
      ) : null}
    </Frame>
  );
}

function WeddingParty(p: P) {
  const { ctx, section, kit } = p;
  const members = list<{ name?: string; role?: string; bio?: string; ref?: string }>(section.content, "members").filter((m) => m.name);
  if (members.length === 0 && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Wedding party">
      {members.length === 0 ? <Editable ctx={ctx} section={section} field="members" label="People" show={false} /> : (
        <ul className="cl-people">
          {members.map((m, i) => (
            <li key={i} className="reveal">
              <Editable ctx={ctx} section={section} field={`members.${i}`} label={`Person ${m.name}`} show>
                <figure className="cl-person">
                  <div className="cl-portrait">
                    <Media src={m.ref ? ctx.imageUrl({ ref: m.ref }, "large") : null} art={kit.art("person", i, `${kit.root}-p-${uid(section, i)}`, ctx, m.name)} />
                  </div>
                  <figcaption><b>{m.name}</b>{m.role ? <span className="cl-role">{m.role}</span> : null}</figcaption>
                  {m.bio ? <p className="cl-bio">{m.bio}</p> : null}
                </figure>
              </Editable>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}

function Contact(p: P) {
  const { ctx, section } = p;
  const note = el(section, "note");
  const email = ctx.site.contact?.email ?? null;
  const phone = ctx.site.contact?.phone ?? null;
  if (!note.show && !email && !phone && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Contact" intro={null}>
      <Editable ctx={ctx} section={section} field="note" label="Note" show={note.show} hidden={note.hidden}>
        <p className="cl-prose reveal">{note.text}</p>
      </Editable>
      {email || phone || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="details" label="Contact details" show={!!(email || phone)}>
          <div className="cl-links reveal">
            {email ? <SiteLink ctx={ctx} href={`mailto:${email}`} newTab={false} className="btn">{email}</SiteLink> : null}
            {phone ? <SiteLink ctx={ctx} href={`tel:${phone.replace(/[^+\d]/g, "")}`} newTab={false} className="btn">{phone}</SiteLink> : null}
          </div>
        </Editable>
      ) : null}
    </Frame>
  );
}

/** A video the couple uploaded, in the design's section frame (each Classic design dresses it). */
function Video(p: P) {
  const { ctx, section } = p;
  const v = videoOf(section);
  if (!v.src && ctx.mode === "public") return null;
  const body = el(section, "body");
  return (
    <Frame {...p} name="Video" intro={null}>
      <Editable ctx={ctx} section={section} field="body" label="Description" show={body.show} hidden={body.hidden}>
        <p className="cl-prose reveal olv-video-desc">{body.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="video" label="Video" show>
        <VideoBlockView ctx={ctx} video={v} title={el(section, "heading").text ?? "Video"} className="cl-video reveal" />
      </Editable>
    </Frame>
  );
}

function Custom(p: P) {
  const { ctx, section } = p;
  if (customIsEmpty(ctx, section) && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Custom section" intro={null}>
      <CustomBlocks ctx={ctx} section={section} className="cl-custom reveal" />
    </Frame>
  );
}

/** The RSVP form and its wording (the design's frame around the shared form). */
export function RsvpBody({ ctx, section }: { ctx: RenderContext; section: SiteSection }) {
  const rsvp = ctx.site.rsvp;
  const labels = rsvpLabels(section.content);
  return (
    <div className="cl-rsvp-card reveal">
      {rsvp.deadline ? (
        <Editable ctx={ctx} section={section} field="labels.deadline" label="Reply-by wording" show>
          <p className="cl-deadline">{labels.deadline} <b>{formatDate(rsvp.deadline)}</b></p>
        </Editable>
      ) : null}
      {!rsvp.isOpen && ctx.mode !== "edit" ? <p className="cl-rsvp-closed">{labels.closed}</p> : (
        <Editable ctx={ctx} section={section} field="labels" label="RSVP form" show>
          <RsvpBlock ctx={ctx} labels={labels} />
        </Editable>
      )}
    </div>
  );
}

function Rsvp(p: P) {
  return (
    <Frame {...p} name="RSVP" className="rsvp-sec">
      <RsvpBody ctx={p.ctx} section={p.section} />
    </Frame>
  );
}

function Footer({ ctx, section, kit }: { ctx: RenderContext; section: SiteSection | null; kit: Kit }) {
  const line = section ? textEl(section.content, "line") : { text: null, hidden: false };
  const badge = section ? footerBadge(section.content) : { text: FOOTER_BADGE_DEFAULT, hidden: false };
  const day = weddingDay(ctx.site);
  const meta = [day?.dots, placeOf(ctx)].filter(Boolean).join(" · ");
  const { couple } = ctx.site;
  const body = (
    <>
      {kit.footerArt ? kit.footerArt(ctx) : null}
      {!line.hidden ? <p className="cl-fnames">{line.text ?? <>{couple.partnerOneName} <em>&amp;</em> {couple.partnerTwoName}</>}</p> : null}
      {meta ? <p className="cl-meta">{meta}</p> : null}
    </>
  );
  return (
    <footer className="foot">
      {section ? <Editable ctx={ctx} section={section} field="line" label="Closing line" show>{body}</Editable> : body}
      {ctx.shareSlot ? <div className="cl-share">{ctx.shareSlot}</div> : null}
      {section ? (
        <Editable ctx={ctx} section={section} field="badge" label="Footer note" show={!badge.hidden && !!badge.text} hidden={badge.hidden}>
          <p className="cl-badge">{badge.text}</p>
        </Editable>
      ) : <p className="cl-badge">{badge.text}</p>}
    </footer>
  );
}

const GENERIC: Record<string, (p: P) => ReactNode> = {
  countdown: Countdown, welcome: Welcome, save_the_date: SaveTheDate, story: Story, events: Events, gallery: Gallery,
  venue: Venue, faq: Faq, registry: Registry, wedding_party: WeddingParty, contact: Contact, video: Video, custom: Custom, rsvp: Rsvp,
  travel: (p) => <InfoSection {...p} name="Travel & stay" variant="travel" />,
  explore: (p) => <InfoSection {...p} name="Things to do" variant="explore" />,
  dress_code: (p) => <InfoSection {...p} name="Dress code" variant="dress" />,
  thank_you: (p) => <InfoSection {...p} name="Thank you" variant="thanks" />,
};

// ───────────── the design ─────────────

/** Builds a Classic design from its kit. */
export function classicDesign(kit: Kit) {
  return function ClassicDesign(ctx: RenderContext) {
    const { site } = ctx;
    const rootId = `${kit.root}-root`;
    const pageId = `${kit.root}-page`;
    const intro = ctx.mode !== "edit" && kit.introMs > 0;
    const used = new Map<string, number>();
    const anchorFor = (s: SiteSection) => {
      const base = s.key.replace(/_/g, "-");
      const n = (used.get(base) ?? 0) + 1;
      used.set(base, n);
      return n === 1 ? base : `${base}-${n}`;
    };
    const hero = site.sections.find((s) => s.key === "hero");
    const footer = site.sections.find((s) => s.key === "footer") ?? null;
    const rsvpSection = site.sections.find((s) => s.key === "rsvp") ?? null;
    const eventsSection = site.sections.find((s) => s.key === "events") ?? null;

    let position = 0;
    const render = (s: SiteSection, i: number): ReactNode => {
      const draw = s.key === "events" && chosenLayout(s, "events", kit.design) ? SharedEvents : kit.sections?.[s.key] ?? GENERIC[s.key];
      if (!draw) return null; // hero and footer are placed explicitly; unknown types are ignored
      const node = draw({ ctx, section: s, anchor: anchorFor(s), kit, index: position++ });
      return <SectionSlot key={s.id ?? `${s.key}-${i}`}>{node}</SectionSlot>;
    };

    const heroNode = hero ? kit.Hero({ ctx, section: hero, kit, rsvp: rsvpSection, events: eventsSection }) : <h1 className="olv-sr" tabIndex={-1}>{names(site)}</h1>;
    const main = (
      <>
        {kit.afterHero ? kit.afterHero(ctx) : null}
        <div className="cl-main">{site.sections.map(render)}</div>
        <Footer ctx={ctx} section={footer} kit={kit} />
      </>
    );
    return (
      <div className={`olv-cl ${kit.root}`} id={rootId} data-theme={kit.design} data-mode={ctx.mode}>
        <DesignAssets design={kit.design} files={["classic/base.css", ...(kit.css ?? ["design.css"])]} theme={kit.design} />
        <div className={`cl-page${intro ? " intro" : ""}`} id={pageId}>
          {intro && kit.Overlay ? kit.Overlay({ ctx }) : null}
          {kit.split ? (
            <div className="layout">
              {heroNode}
              <div className="content">{main}</div>
            </div>
          ) : <>{heroNode}{main}</>}
        </div>
        {intro ? <Entrance pageId={pageId} ms={kit.introMs} overlay={!!kit.Overlay} /> : null}
        {ctx.mode !== "edit" ? <RevealObserver rootId={rootId} /> : null}
      </div>
    );
  };
}

function SectionSlot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
