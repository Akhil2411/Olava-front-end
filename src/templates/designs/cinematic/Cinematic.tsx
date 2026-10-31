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
import { MusicButton } from "../shared/MusicButton";
import { Embers } from "./Embers";
import { Engine } from "./Engine";
import { Opening } from "./Opening";
import { still, type StillKind } from "./art";
import { Stills, type Still } from "./Stills";
import { EventList, FaqList } from "../shared/EventList";
import { chosenLayout } from "../shared/layouts";
import { PhotoGallery } from "../shared/PhotoGallery";

const THEMES = ["noor", "royal-gold", "emerald-maharani", "rose-dusk", "midnight-sapphire"];
export const CINEMATIC_THEMES = THEMES;

type P = { ctx: RenderContext; section: SiteSection; anchor: string };

// ───────────── small building blocks ─────────────

/** "Will you join us?" → Will you / <em>join us?</em>: the last word (or a short last pair) in the serif italic. */
function split(text: string): [string, string] {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return ["", text];
  let cut = words.length - 1;
  const bare = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "");
  if (cut > 0 && bare(words[cut]).length <= 3) cut--;
  if (cut > 0 && /^(&|and)$/i.test(words[cut - 1])) cut--;
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

/** Two masked lines, the second in the serif italic (the supplied design's big titles). */
function Lines({ text }: { text: string }) {
  const [a, b] = split(text);
  return (
    <>
      {a ? <span className="mask"><span className="line">{a}</span></span> : null}
      <span className="mask"><span className="line"><em>{b}</em></span></span>
    </>
  );
}

/** The section label: small accent label (the section's eyebrow) and the heading, e.g. "OUR STORY —— How it began". */
function Chap({ ctx, section, anchor, center = false, as = "h2" }: P & { center?: boolean; as?: "h2" | "p" }) {
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  const Tag = as;
  return (
    <Tag className={`chap${center ? " center" : ""}`} id={as === "h2" ? `${anchor}-title` : undefined}>
      <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden} inline>
        <span className="chap-eb">{eyebrow.text}</span>
      </Editable>
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden} inline>
        <span className="chap-title">{heading.text}</span>
      </Editable>
    </Tag>
  );
}

function Intro({ ctx, section, field = "intro", className = "sec-intro" }: { ctx: RenderContext; section: SiteSection; field?: string; className?: string }) {
  const intro = el(section, field);
  return (
    <Editable ctx={ctx} section={section} field={field} label="Introduction" show={intro.show} hidden={intro.hidden}>
      <p className={`${className} reveal`}>{intro.text}</p>
    </Editable>
  );
}

function Sec({ section, anchor, className, children }: { section: SiteSection; anchor: string; className: string; children: ReactNode }) {
  const heading = el(section, "heading");
  return (
    <section id={anchor} className={className} data-section={section.key} aria-labelledby={heading.show ? `${anchor}-title` : undefined}>
      {children}
    </section>
  );
}

/** A photo, or one of the design's cinematic placeholder stills (tinted by the theme). */
function Frame({ src, alt, kind, seed, id, className, label }: { src: string | null; alt?: string | null; kind: StillKind; seed: number; id: string; className?: string; label?: string }) {
  return (
    <div data-still="" className={[className, src ? "has-photo" : null].filter(Boolean).join(" ")} aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={alt ?? ""} loading="lazy" /> : <span className="still-art" dangerouslySetInnerHTML={{ __html: still(kind, seed, id) }} />}
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const words = (text: string) => text.split(/(\s+)/).map((w, i) => (/^\s+$/.test(w) || !w ? w : <span key={i} className="word">{w}</span>));

// ───────────── hero ─────────────

function dateRange(ctx: RenderContext): string | null {
  const days = [...new Set(ctx.site.events.map((e) => e.startsAtLocal.slice(0, 10)))].sort();
  if (days.length > 1) {
    const first = days[0], last = days.at(-1)!;
    const sameYear = first.slice(0, 4) === last.slice(0, 4);
    return `${dateOf(first, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" })} — ${dateOf(last, { day: "numeric", month: "short", year: "numeric" })}`;
  }
  const d = weddingDay(ctx.site);
  return d ? d.long : null;
}

function Hero({ ctx, section }: { ctx: RenderContext; section: SiteSection }) {
  const { couple } = ctx.site;
  const c = section.content;
  const eyebrow = el(section, "eyebrow");
  const joiner = el(section, "joiner");
  const tagline = el(section, "tagline");
  const img = imageEl(c);
  const photo = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  const range = !bool(c, "hideDate") ? dateRange(ctx) : null;
  const venue = ctx.site.events.find((e) => e.venue)?.venue;
  const place = !bool(c, "hideVenue") && venue ? (venue.city ? [venue.city, venue.state].filter(Boolean).join(", ") : venue.name) : null;
  const cd = ctx.site.sections.find((s) => s.key === "countdown") ?? null;
  const target = countdownTarget(ctx.site);
  const cdHeading = cd ? el(cd, "heading") : null;
  const unit = (key: string, fb: string) => (cd ? labelOf(cd.content, key, fb) : fb).slice(0, 1).toLowerCase();

  return (
    <section className="hero" id="hero" aria-label={names(ctx.site)}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <div className="hero-media" data-speed="-0.25">
        <Editable ctx={ctx} section={section} field="image" label="Photo" show hidden={img.hidden} className="hero-media-edit">
          <Frame src={photo} alt={img.alt} kind="palace" seed={1} id="ci-hero" className="kb" />
        </Editable>
      </div>
      {isEdit(ctx) ? null : <Embers className="embers" count={34} />}
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-copy">
        <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
          <p className="eyebrow split-chars">
            <span className="olv-sr">{eyebrow.text}</span>
            {[...(eyebrow.text ?? "")].map((ch, i) => <span key={i} aria-hidden="true" style={{ transitionDelay: `${(1.3 + i * 0.03).toFixed(2)}s` }}>{ch === " " ? " " : ch}</span>)}
          </p>
        </Editable>
        <h1 className="names" tabIndex={-1}>
          <span className="mask"><span className="line">{couple.partnerOneName}</span></span>
          <span className="mask amp-wrap">
            <Editable ctx={ctx} section={section} field="joiner" label="Word between the names" show={joiner.show} hidden={joiner.hidden} inline>
              <span className="line amp">{joiner.text}</span>
            </Editable>
            {joiner.show ? null : <span className="olv-sr"> &amp; </span>}
          </span>
          <span className="mask"><span className="line">{couple.partnerTwoName}</span></span>
        </h1>
        <Editable ctx={ctx} section={section} field="tagline" label="Invitation line" show={tagline.show} hidden={tagline.hidden}>
          <p className="hero-tag">{tagline.text}</p>
        </Editable>
        {range || place || cd ? (
          <div className="hero-meta">
            {range || place ? (
              <Editable ctx={ctx} section={section} field="date" label="Date and place" show>
                <p>{place ? <small>{place}</small> : null}{range}</p>
              </Editable>
            ) : <span />}
            {cd && (target || showPlaceholders(ctx)) ? (
              <div id="countdown" data-section="countdown" className="cd-wrap">
                <SectionEditChip ctx={ctx} section={cd} name="Countdown" />
                <Editable ctx={ctx} section={cd} field="labels" label="Countdown wording" show>
                  <p className="cd" role="timer" aria-label="Time until the wedding">
                    <Editable ctx={ctx} section={cd} field="heading" label="Heading" show={!!cdHeading?.show} hidden={cdHeading?.hidden} inline>
                      <small>{cdHeading?.text}</small>
                    </Editable>
                    {target ? (["d", "h", "m", "s"] as const).map((u, i) => (
                      <span key={u}>{i ? " " : ""}<span><CountdownValue target={target} unit={u} pad /></span>{unit(["daysUnit", "hoursUnit", "minutesUnit", "secondsUnit"][i], ["Days", "Hours", "Minutes", "Seconds"][i])}</span>
                    )) : "Add your wedding date"}
                  </p>
                </Editable>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="scroll-cue" aria-hidden="true"><i /></div>
    </section>
  );
}

// ───────────── sections ─────────────

/** The prologue: a letter that lights up word by word as you scroll, signed by the couple. */
function Welcome({ ctx, section, anchor }: P) {
  const body = el(section, "body");
  const sign = el(section, "signature");
  if (!body.show && !sign.show && ctx.mode === "public" && !el(section, "heading").show) return null;
  return (
    <Sec section={section} anchor={anchor} className="prologue">
      <SectionEditChip ctx={ctx} section={section} name="Welcome note" />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <Editable ctx={ctx} section={section} field="body" label="Letter" show={body.show} hidden={body.hidden}>
        <p className="scrub">{words(body.text ?? "")}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="signature" label="Signature" show={sign.show} hidden={sign.hidden}>
        <p className="sig">{sign.text} {names(ctx.site)}</p>
      </Editable>
    </Sec>
  );
}

type Chapter = { label?: string; title?: string; text?: string; ref?: string | null; alt?: string };
const STORY_STILLS: StillKind[] = ["rain", "lanterns", "lake", "ring"];

/** Our story: a pinned reel that scrolls sideways, one frame per chapter, with a frame counter and progress bar. */
function Story({ ctx, section, anchor }: P) {
  const body = el(section, "body");
  const chapters = list<Chapter>(section.content, "chapters").filter((ch) => ch.title);
  const img = imageEl(section.content);
  if (!body.show && chapters.length === 0 && !img.ref && ctx.mode === "public") return null;
  const photo = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  if (chapters.length === 0) {
    return (
      <Sec section={section} anchor={anchor} className="prologue story-text">
        <SectionEditChip ctx={ctx} section={section} name="Our story" />
        <Chap ctx={ctx} section={section} anchor={anchor} />
        {photo || isEdit(ctx) ? (
          <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!photo} hidden={img.hidden}>
            <Frame src={photo} alt={img.alt} kind="rain" seed={1} id={`ci-st-${uid(section, 0)}`} className="story-photo reveal" />
          </Editable>
        ) : null}
        <Editable ctx={ctx} section={section} field="body" label="Story text" show={body.show} hidden={body.hidden}>
          <p className="scrub">{words(body.text ?? "")}</p>
        </Editable>
        {isEdit(ctx) ? <Editable ctx={ctx} section={section} field="chapters" label="Chapters" show={false} /> : null}
      </Sec>
    );
  }
  return (
    <Sec section={section} anchor={anchor} className={`story${chapters.length > 1 ? " reel" : ""}`}>
      <SectionEditChip ctx={ctx} section={section} name="Our story" />
      <div className="story-pin">
        <div className="story-head">
          <Chap ctx={ctx} section={section} anchor={anchor} />
          <p className="frame-count" aria-hidden="true"><b>01</b> / <span>{pad(chapters.length)}</span></p>
        </div>
        <div className="story-track">
          {chapters.map((ch, i) => (
            <article className={`frame${i === 0 ? " on" : ""}`} key={i}>
              <Editable ctx={ctx} section={section} field={`chapters.${i}`} label={`Chapter ${ch.title}`} show className="frame-edit">
                <Frame src={ch.ref ? ctx.imageUrl({ ref: ch.ref }, "large") : null} alt={ch.alt} kind={STORY_STILLS[i % 4]} seed={i + 2} id={`ci-st-${uid(section, i)}`} className="frame-img" />
                <div className="frame-txt">
                  {ch.label ? <span>{ch.label}</span> : null}
                  <h3>{ch.title}</h3>
                  {ch.text ? <p>{ch.text}</p> : null}
                </div>
              </Editable>
            </article>
          ))}
        </div>
        <div className="story-bottom">
          <Editable ctx={ctx} section={section} field="body" label="Introduction" show={body.show} hidden={body.hidden}>
            <p className="story-intro">{body.text}</p>
          </Editable>
          <div className="story-bar" aria-hidden="true"><i /></div>
        </div>
      </div>
    </Sec>
  );
}

const NIGHT_STILLS: StillKind[] = ["henna", "marigold", "sparklers", "mandap", "palace"];

/** The nights: one full-screen scene per event, each tinting the page in its own colour (five tones, repeating). */
function Events({ ctx, section, anchor }: P) {
  const c = section.content;
  const events = eventsFor(ctx.site);
  const showCal = bool(c, "showCalendar", true);
  const cal = labelOf(c, "calendarLabel", "Add to calendar");
  const wear = labelOf(c, "dressCodeLabel", "Dress code:").replace(/:\s*$/, "");
  const timeLabel = labelOf(c, "timeLabel", "Time");
  const placeLabel = labelOf(c, "placeLabel", "Place");
  const layout = chosenLayout(section, "events", "cinematic");
  return (
    <Sec section={section} anchor={anchor} className="nights">
      <SectionEditChip ctx={ctx} section={section} name="Events" />
      <header className="nights-head">
        <Chap ctx={ctx} section={section} anchor={anchor} center />
        <Intro ctx={ctx} section={section} className="nights-intro" />
      </header>
      {events.length === 0 ? (
        <Editable ctx={ctx} section={section} field="labels" label="Events wording" show>
          <p className="nights-intro reveal">{labelOf(c, "emptyText", "Event details are coming soon.")}</p>
        </Editable>
      ) : layout ? <div className="shared-layout"><EventList ctx={ctx} section={section} layout={layout} /></div> : events.map((e, i) => (
        <article className={`night${i % 2 ? " flip" : ""}`} data-tone={(i % 5) + 1} key={`${e.name}-${i}`}>
          <div className="night-num" data-speed="0.12" aria-hidden="true">{pad(i + 1)}</div>
          <Editable ctx={ctx} section={section} field={`events.${i}.cover`} label={`Cover photo for ${e.name}`} show className="night-img-edit">
            <Frame src={e.cover?.ref ? ctx.imageUrl({ ref: e.cover.ref }, "large") : null} kind={NIGHT_STILLS[i % 5]} seed={i + 1} id={`ci-n-${uid(section, i)}`} className="night-img" />
          </Editable>
          <div className="night-txt">
            <p className="kick">{dateOf(e.startsAtLocal, { weekday: "long" })} · {dateOf(e.startsAtLocal, { day: "numeric", month: "long" })}</p>
            <h3 className="night-title"><span>{e.name}</span></h3>
            {e.description ? <p className="lede">{e.description}</p> : null}
            <Editable ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show>
              <dl>
                <div><dt>{timeLabel}</dt><dd><time dateTime={e.startsAt}>{timeOf(e.startsAtLocal)}{e.endsAtLocal && e.endsAtLocal.slice(0, 10) === e.startsAtLocal.slice(0, 10) ? ` – ${timeOf(e.endsAtLocal)}` : ""}</time></dd></div>
                {e.venue ? <div><dt>{placeLabel}</dt><dd>{e.venue.name}</dd></div> : null}
                {e.dressCode ? <div><dt>{wear}</dt><dd>{e.dressCode}</dd></div> : null}
              </dl>
            </Editable>
            {e.notes ? <p className="night-note">{e.notes}</p> : null}
            {showCal ? (
              <Editable ctx={ctx} section={section} field="labels.calendarLabel" label="“Add to calendar” wording" show>
                <AddToCalendar events={[calendarEvent(ctx.site, e)]} fileName={`${fileSlug(ctx.site)}-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="link-line" disabled={isEdit(ctx)}>
                  {cal}<span className="olv-sr">: {e.name}</span>
                </AddToCalendar>
              </Editable>
            ) : null}
          </div>
        </article>
      ))}
    </Sec>
  );
}

/** The families and the wedding party ("the cast"): the families billed side by side, then portraits. */
function WeddingParty({ ctx, section, anchor }: P) {
  const members = list<{ name?: string; role?: string; bio?: string; ref?: string }>(section.content, "members").filter((m) => m.name);
  const hero = ctx.site.sections.find((s) => s.key === "hero") ?? null;
  const fam = hero ? (["partnerOneFamily", "partnerTwoFamily"] as const).map((k) => el(hero, k)) : [];
  const showBilling = fam.some((f) => f.show) || (isEdit(ctx) && hero);
  if (members.length === 0 && !fam.some((f) => f.show) && ctx.mode === "public") return null;
  const { couple } = ctx.site;
  return (
    <Sec section={section} anchor={anchor} className="cast">
      <SectionEditChip ctx={ctx} section={section} name="Wedding party" />
      <Chap ctx={ctx} section={section} anchor={anchor} center />
      {showBilling && hero ? (
        <div className="billing reveal">
          <div>
            <p className="role">{couple.partnerOneName}</p>
            <Editable ctx={ctx} section={hero} field="partnerOneFamily" label={`${couple.partnerOneName}'s family line`} show={fam[0].show} hidden={fam[0].hidden}>
              <p className="who">{fam[0].text}</p>
            </Editable>
          </div>
          <span className="billing-amp" aria-hidden="true">&amp;</span>
          <div>
            <p className="role">{couple.partnerTwoName}</p>
            <Editable ctx={ctx} section={hero} field="partnerTwoFamily" label={`${couple.partnerTwoName}'s family line`} show={fam[1].show} hidden={fam[1].hidden}>
              <p className="who">{fam[1].text}</p>
            </Editable>
          </div>
        </div>
      ) : null}
      <Intro ctx={ctx} section={section} className="cast-sub" />
      {members.length === 0 ? <Editable ctx={ctx} section={section} field="members" label="People" show={false} /> : (
        <ul className="cast-grid">
          {members.map((m, i) => (
            <li key={i} className="reveal">
              <Editable ctx={ctx} section={section} field={`members.${i}`} label={`Person ${m.name}`} show>
                <figure>
                  <Frame src={m.ref ? ctx.imageUrl({ ref: m.ref }, "large") : null} kind="cameo" seed={(i % 6) + 1} id={`ci-p-${uid(section, i)}`} className="cameo" />
                  <figcaption><b>{m.name}</b>{m.role}</figcaption>
                  {m.bio ? <p className="cameo-bio">{m.bio}</p> : null}
                </figure>
              </Editable>
            </li>
          ))}
        </ul>
      )}
    </Sec>
  );
}

const GALLERY_STILLS: StillKind[] = ["mandap", "marigold", "lake", "lanterns", "palace", "sparklers", "ring"];

function Gallery({ ctx, section, anchor }: P) {
  const photos = ctx.site.gallery;
  if (photos.length === 0 && ctx.mode === "public") return null;
  const stills: Still[] = photos.length
    ? photos.map((p) => ({ src: ctx.imageUrl(p, "large") ?? undefined, alt: p.caption ?? "" }))
    : GALLERY_STILLS.map((k, i) => ({ alt: "", art: still(k, i + 3, `ci-g-${uid(section, i)}`) }));
  const layout = chosenLayout(section, "gallery", "cinematic");
  return (
    <Sec section={section} anchor={anchor} className="stills">
      <SectionEditChip ctx={ctx} section={section} name="Gallery" />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <Intro ctx={ctx} section={section} />
      <Editable ctx={ctx} section={section} field="photos" label="Photos" show>
        {layout ? <div className="shared-layout"><PhotoGallery layout={layout} tiles={stills} interactive={!isEdit(ctx) && photos.length > 0} /></div>
          : <Stills stills={stills} interactive={!isEdit(ctx) && photos.length > 0} />}
      </Editable>
    </Sec>
  );
}

/** The setting: the venue as a full-bleed scene with its name in large type, then an Open in Maps card per venue. */
function Venue({ ctx, section, anchor }: P) {
  const c = section.content;
  const venues = venuesFor(ctx.site);
  if (venues.length === 0 && ctx.mode === "public") return null;
  const first = venues[0];
  const label = labelOf(c, "directionsLabel", "Open in Maps");
  return (
    <Sec section={section} anchor={anchor} className="place">
      <SectionEditChip ctx={ctx} section={section} name="Venue" />
      <div className="place-hero">
        <div className="place-img" data-speed="-0.12"><Frame src={null} kind="lake" seed={3} id={`ci-v-${uid(section, 0)}`} /></div>
        <div className="place-title">
          <Chap ctx={ctx} section={section} anchor={anchor} />
          {first ? <h3 className="big"><Lines text={first.name} /></h3> : null}
          {first ? <p className="addr">{[first.addressLine, first.city, first.state].filter(Boolean).join(" · ")}</p> : null}
        </div>
      </div>
      <Intro ctx={ctx} section={section} className="place-intro" />
      {venues.length === 0 ? (
        <Editable ctx={ctx} section={section} field="labels" label="Venue wording" show>
          <p className="place-intro">{labelOf(c, "emptyText", "Add a venue to your events to show it here.")}</p>
        </Editable>
      ) : (
        <div className={`maps${venues.length > 1 ? " many" : ""}`}>
          {venues.map((v, i) => (
            <div key={i} className="reveal">
              <p className="kick">{v.events.join(" · ")}</p>
              <Editable ctx={ctx} section={section} field="directionsLabel" label="Map link wording" show>
                <MapCard ctx={ctx} href={mapsUrl(v)} name={v.name} address={venueLine(v)} label={label} id={`${uid(section, 0)}-${i}`} />
              </Editable>
            </div>
          ))}
        </div>
      )}
    </Sec>
  );
}

type Item = { label?: string; title?: string; text?: string; url?: string; linkLabel?: string; ref?: string | null; alt?: string; colors?: string[] | null };

/** Travel, things to do, thank you: three-up notes (kicker, title, text) as in the supplied "setting" chapter. */
function InfoSection({ ctx, section, anchor, name }: P & { name: string }) {
  const body = el(section, "body");
  const items = list<Item>(section.content, "items").filter((i) => i.title);
  const img = imageEl(section.content);
  const photo = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  if (!body.show && items.length === 0 && !img.ref && list(section.content, "links").length === 0 && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor} className="notes">
      <SectionEditChip ctx={ctx} section={section} name={name} />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <Intro ctx={ctx} section={section} field="body" />
      {photo || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!photo} hidden={img.hidden}>
          <Frame src={photo} alt={img.alt} kind="lake" seed={5} id={`ci-i-${uid(section, 0)}`} className="notes-photo reveal" />
        </Editable>
      ) : null}
      {items.length === 0 ? (isEdit(ctx) ? <Editable ctx={ctx} section={section} field="items" label="Items" show={false} /> : null) : (
        <div className="place-grid">
          {items.map((it, i) => {
            const href = safeHref(it.url);
            const pic = it.ref ? ctx.imageUrl({ ref: it.ref }, "large") : null;
            return (
              <div key={i} className="reveal">
                <Editable ctx={ctx} section={section} field={`items.${i}`} label={`Item ${it.title}`} show>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {pic ? <img className="item-photo" src={pic} alt={it.alt ?? ""} loading="lazy" /> : null}
                  {it.label ? <p className="kick">{it.label}</p> : null}
                  <h3>{it.title}</h3>
                  {it.text ? <p>{it.text}</p> : null}
                  {href ? <SiteLink ctx={ctx} href={href} className="link-line">{it.linkLabel || "Find out more"}</SiteLink> : null}
                </Editable>
              </div>
            );
          })}
        </div>
      )}
      <Links ctx={ctx} section={section} />
    </Sec>
  );
}

/** What to wear: each item with its colour swatches (the supplied palette rows). */
function DressCode({ ctx, section, anchor }: P) {
  const body = el(section, "body");
  const items = list<Item>(section.content, "items").filter((i) => i.title);
  if (!body.show && items.length === 0 && ctx.mode === "public") return null;
  const valid = (c: string) => /^#[0-9a-f]{6}$/i.test(c);
  return (
    <Sec section={section} anchor={anchor} className="palette">
      <SectionEditChip ctx={ctx} section={section} name="Dress code" />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <Intro ctx={ctx} section={section} field="body" />
      {items.length === 0 ? (isEdit(ctx) ? <Editable ctx={ctx} section={section} field="items" label="Items" show={false} /> : null) : (
        <div className="pal-rows">
          {items.map((it, i) => (
            <Editable key={i} ctx={ctx} section={section} field={`items.${i}`} label={`Item ${it.title}`} show>
              <div className="pal-row reveal">
                <span className="pal-name">{it.title}</span>
                {it.label ? <p className="kick">{it.label}</p> : null}
                {(it.colors ?? []).filter(valid).length ? (
                  <p className="pal-swatches">{(it.colors ?? []).filter(valid).map((c, k) => <i key={k} style={{ background: c }} aria-hidden="true" />)}</p>
                ) : null}
                {it.text ? <p className="pal-text">{it.text}</p> : null}
              </div>
            </Editable>
          ))}
        </div>
      )}
      <Links ctx={ctx} section={section} />
    </Sec>
  );
}

function Links({ ctx, section }: { ctx: RenderContext; section: SiteSection }) {
  const links = list<{ label?: string; url?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (links.length === 0 && !isEdit(ctx)) return null;
  return (
    <Editable ctx={ctx} section={section} field="links" label="Buttons" show={links.length > 0}>
      <div className="ci-links reveal">{links.map((l, i) => <SiteLink key={i} ctx={ctx} href={safeHref(l.url)} className="link-line">{l.label}</SiteLink>)}</div>
    </Editable>
  );
}

function SaveTheDate({ ctx, section, anchor }: P) {
  const c = section.content;
  const note = el(section, "note");
  const day = weddingDay(ctx.site);
  const events = weddingCalendar(ctx.site);
  if (!day && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor} className="reply std">
      <SectionEditChip ctx={ctx} section={section} name="Save the date" />
      <Chap ctx={ctx} section={section} anchor={anchor} center />
      <Editable ctx={ctx} section={section} field="note" label="Note" show={note.show} hidden={note.hidden}>
        <p className="by">{note.text}</p>
      </Editable>
      <p className="big-q">{day ? <><span className="mask"><span className="line">{day.weekday}</span></span><span className="mask"><span className="line"><em>{day.long}</em></span></span></> : "Add your wedding date"}</p>
      {events.length ? (
        <Editable ctx={ctx} section={section} field="buttonLabel" label="Button wording" show>
          <AddToCalendar events={events} fileName={`${fileSlug(ctx.site)}-wedding`} className="link-line" disabled={isEdit(ctx)}>{labelOf(c, "buttonLabel", "Save the date")}</AddToCalendar>
        </Editable>
      ) : null}
    </Sec>
  );
}

function Rsvp({ ctx, section, anchor }: P) {
  const rsvp = ctx.site.rsvp;
  const labels = rsvpLabels(section.content);
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  return (
    <Sec section={section} anchor={anchor} className="reply">
      <SectionEditChip ctx={ctx} section={section} name="RSVP" />
      <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
        <p className="chap center"><span className="chap-eb">{eyebrow.text}</span></p>
      </Editable>
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
        <h2 className="big-q" id={`${anchor}-title`}><Lines text={heading.text ?? ""} /></h2>
      </Editable>
      {rsvp.deadline ? (
        <Editable ctx={ctx} section={section} field="labels.deadline" label="Reply-by wording" show>
          <p className="by">{labels.deadline} {formatDate(rsvp.deadline)}</p>
        </Editable>
      ) : null}
      <Intro ctx={ctx} section={section} className="reply-intro" />
      <div className="reply-form">
        {!rsvp.isOpen && ctx.mode !== "edit" ? <p className="reply-closed">{labels.closed}</p> : (
          <Editable ctx={ctx} section={section} field="labels" label="RSVP form" show>
            <RsvpBlock ctx={ctx} labels={labels} />
          </Editable>
        )}
      </div>
    </Sec>
  );
}

function Faq({ ctx, section, anchor }: P) {
  const items = list<{ question?: string; answer?: string }>(section.content, "items").filter((i) => i.question && i.answer);
  if (items.length === 0 && ctx.mode === "public") return null;
  const faqLayout = chosenLayout(section, "faq", "cinematic");
  return (
    <Sec section={section} anchor={anchor} className="faq">
      <SectionEditChip ctx={ctx} section={section} name="FAQ" />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <Intro ctx={ctx} section={section} />
      {faqLayout ? <div className="shared-layout"><FaqList ctx={ctx} section={section} items={items} layout={faqLayout} /></div> : <Editable ctx={ctx} section={section} field="items" label="Questions" show={items.length > 0}>
        <div className="faq-list">
          {items.map((it, i) => (
            <details key={i} className="reveal" open={isEdit(ctx) || undefined}>
              <summary>{it.question}</summary>
              <p>{it.answer}</p>
            </details>
          ))}
        </div>
      </Editable>}
    </Sec>
  );
}

function Registry({ ctx, section, anchor }: P) {
  const intro = el(section, "intro");
  const links = list<{ label?: string; url?: string; description?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (!intro.show && links.length === 0 && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor} className="notes gifts">
      <SectionEditChip ctx={ctx} section={section} name="Gift registry" />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <Intro ctx={ctx} section={section} />
      {links.length || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="links" label="Registry links" show={links.length > 0}>
          <div className="place-grid">
            {links.map((l, i) => (
              <div key={i} className="reveal">
                <p className="kick">{pad(i + 1)}</p>
                <h3>{l.label}</h3>
                {l.description ? <p>{l.description}</p> : null}
                <SiteLink ctx={ctx} href={safeHref(l.url)} className="link-line">{l.label}</SiteLink>
              </div>
            ))}
          </div>
        </Editable>
      ) : null}
    </Sec>
  );
}

function Contact({ ctx, section, anchor }: P) {
  const note = el(section, "note");
  const email = ctx.site.contact?.email ?? null;
  const phone = ctx.site.contact?.phone ?? null;
  if (!note.show && !email && !phone && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor} className="notes">
      <SectionEditChip ctx={ctx} section={section} name="Contact" />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <Intro ctx={ctx} section={section} field="note" />
      {email || phone || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="details" label="Contact details" show={!!(email || phone)}>
          <div className="ci-links reveal">
            {email ? <SiteLink ctx={ctx} href={`mailto:${email}`} newTab={false} className="link-line">{email}</SiteLink> : null}
            {phone ? <SiteLink ctx={ctx} href={`tel:${phone.replace(/[^+\d]/g, "")}`} newTab={false} className="link-line">{phone}</SiteLink> : null}
          </div>
        </Editable>
      ) : null}
    </Sec>
  );
}

/** A video the couple uploaded: the chapter heading, an optional description and the player, letterboxed. */
function Video({ ctx, section, anchor }: P) {
  const v = videoOf(section);
  if (!v.src && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor} className="notes ci-video">
      <SectionEditChip ctx={ctx} section={section} name="Video" />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <Intro ctx={ctx} section={section} field="body" className="sec-intro olv-video-desc" />
      <Editable ctx={ctx} section={section} field="video" label="Video" show>
        <VideoBlockView ctx={ctx} video={v} title={el(section, "heading").text ?? "Video"} className="reveal" />
      </Editable>
    </Sec>
  );
}

function Custom({ ctx, section, anchor }: P) {
  if (customIsEmpty(ctx, section) && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor} className="notes custom">
      <SectionEditChip ctx={ctx} section={section} name="Custom section" />
      <Chap ctx={ctx} section={section} anchor={anchor} />
      <CustomBlocks ctx={ctx} section={section} className="ci-custom reveal" />
    </Sec>
  );
}

/** End credits: they roll up the screen (on the live site), built from the couple's own details. */
function Credits({ ctx, section }: { ctx: RenderContext; section: SiteSection | null }) {
  const c = section?.content ?? {};
  const line = section ? textEl(c, "line") : { text: null, hidden: false };
  const badge = section ? footerBadge(c) : { text: FOOTER_BADGE_DEFAULT, hidden: false };
  const { couple } = ctx.site;
  const hero = ctx.site.sections.find((s) => s.key === "hero") ?? null;
  const families = hero ? (["partnerOneFamily", "partnerTwoFamily"] as const).map((k) => el(hero, k)).filter((f) => f.show).map((f) => f.text!) : [];
  const party = ctx.site.sections.filter((s) => s.key === "wedding_party")
    .flatMap((s) => list<{ name?: string }>(s.content, "members").map((m) => m.name?.trim().split(/\s+/)[0]).filter(Boolean) as string[]);
  const venue = venuesOf(ctx.site)[0];
  const day = weddingDay(ctx.site);
  const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} & ${xs.at(-1)}`);
  const rows: [string, string, string][] = [
    ["starringLabel", "Starring", names(ctx.site)],
    ...(families.length ? [["withLabel", "With", families.join(" · ")] as [string, string, string]] : []),
    ...(party.length ? [["featuringLabel", "Featuring", join(party)] as [string, string, string]] : []),
    ...(venue ? [["locationLabel", "Filmed on location", [venue.name, venue.city].filter(Boolean).join(", ")] as [string, string, string]] : []),
  ];
  const body = (
    <>
      {rows.map(([key, fb, who]) => (
        <div className="credit-row" key={key}>
          <p className="role">{labelOf(c, key, fb)}</p>
          <p className="who">{who}</p>
        </div>
      ))}
      {!line.hidden ? <p className="fin">{line.text ?? <>{couple.partnerOneName} <span>&amp; {couple.partnerTwoName}</span></>}</p> : null}
      {day ? <p className="end-date">{day.dots}</p> : null}
    </>
  );
  return (
    <footer className="ci-footer">
      <div className="credits">
      <div className="credits-pin">
        <div className="credits-roll">
          {section ? <Editable ctx={ctx} section={section} field="credits" label="Closing credits" show>{body}</Editable> : body}
        </div>
      </div>
      </div>
      <div className="ci-foot">
        {ctx.shareSlot ? <div className="ci-share">{ctx.shareSlot}</div> : null}
        {section ? (
          <Editable ctx={ctx} section={section} field="badge" label="Footer note" show={!badge.hidden && !!badge.text} hidden={badge.hidden}>
            <p className="ci-badge">{badge.text}</p>
          </Editable>
        ) : <p className="ci-badge">{badge.text}</p>}
      </div>
    </footer>
  );
}

// ───────────── the design ─────────────

/** Cinematic: the wedding as a film. A lamp-lit title card opens onto letterboxed scenes (5 colour themes). */
export function Cinematic(ctx: RenderContext) {
  const { site } = ctx;
  const theme = THEMES.includes(site.theme.palette.key) ? site.theme.palette.key : "noor";
  const rootId = "olv-ci-root";
  const pageId = "olv-ci-page";
  const live = ctx.mode !== "edit";
  const used = new Map<string, number>();
  const anchorFor = (s: SiteSection) => {
    const base = s.key.replace(/_/g, "-");
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  const hero = site.sections.find((s) => s.key === "hero");
  const footer = site.sections.find((s) => s.key === "footer") ?? null;
  const heroEyebrow = hero ? el(hero, "eyebrow") : null;
  const heroTagline = hero ? el(hero, "tagline") : null;
  const joiner = hero ? el(hero, "joiner") : null;
  const openingNote = hero ? textEl(hero.content, "openingNote") : { text: "Our film begins with music", hidden: false };
  const music = site.music;

  const render = (s: SiteSection, i: number): ReactNode => {
    const key = s.id ?? `${s.key}-${i}`;
    const props = { ctx, section: s, anchor: anchorFor(s) };
    switch (s.key) {
      case "welcome": return <Welcome key={key} {...props} />;
      case "save_the_date": return <SaveTheDate key={key} {...props} />;
      case "story": return <Story key={key} {...props} />;
      case "events": return <Events key={key} {...props} />;
      case "wedding_party": return <WeddingParty key={key} {...props} />;
      case "gallery": return <Gallery key={key} {...props} />;
      case "venue": return <Venue key={key} {...props} />;
      case "travel": return <InfoSection key={key} {...props} name="Travel & stay" />;
      case "explore": return <InfoSection key={key} {...props} name="Things to do" />;
      case "thank_you": return <InfoSection key={key} {...props} name="Thank you" />;
      case "dress_code": return <DressCode key={key} {...props} />;
      case "faq": return <Faq key={key} {...props} />;
      case "registry": return <Registry key={key} {...props} />;
      case "contact": return <Contact key={key} {...props} />;
      case "video": return <Video key={key} {...props} />;
      case "custom": return <Custom key={key} {...props} />;
      case "rsvp": return <Rsvp key={key} {...props} />;
      default: return null; // hero, footer and the countdown (shown in the hero) are placed explicitly
    }
  };

  const audio = music?.audio ? ctx.imageUrl({ ref: music.audio.ref }, "audio") : null;
  return (
    <div className="olv-ci" id={rootId} data-theme={theme} data-mode={ctx.mode}>
      <DesignAssets design="cinematic" files={["design.css", `theme-${theme}.css`]} theme={theme} />
      <div className={`ci-page${live ? "" : " ready-to-open is-entered"}`} id={pageId}>
        {live ? (
          <Opening pageId={pageId} storageKey={`${site.template.key}:${names(site)}`}
            c1={heroEyebrow?.show ? heroEyebrow.text : null} c2={heroTagline?.show ? heroTagline.text : null}
            names={[site.couple.partnerOneName, site.couple.partnerTwoName]} joiner={joiner?.show ? joiner.text! : "&"}
            note={music && !openingNote.hidden && openingNote.text ? openingNote.text : null} />
        ) : null}
        {live ? <><div className="letterbox top" aria-hidden="true" /><div className="letterbox bottom" aria-hidden="true" /><div className="grain" aria-hidden="true" /></> : null}
        {live ? <div className="cursor" aria-hidden="true"><span className="dot" /><span className="ring"><em /></span></div> : null}
        <div className="ci-main">
          {hero ? <Hero ctx={ctx} section={hero} /> : <h1 className="olv-sr" tabIndex={-1}>{names(site)}</h1>}
          {site.sections.map(render)}
        </div>
        <Credits ctx={ctx} section={footer} />
      </div>
      {music ? <MusicButton music={music} src={audio} accent={site.theme.palette.accent} edit={isEdit(ctx)} /> : null}
      {live ? <Engine rootId={rootId} pageId={pageId} /> : null}
    </div>
  );
}
