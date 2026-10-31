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
  calendarEvent, countdownTarget, dateOf, el, fileSlug, isEdit, mapsUrl, names, showPlaceholders, timeOf, uid, venueLine, weddingCalendar, weddingDay, eventsFor, venuesFor,
} from "../shared/data";
import { MapCard } from "../shared/MapCard";
import { Swatches } from "../shared/Swatches";
import { MusicButton } from "../shared/MusicButton";
import { RevealObserver } from "../shared/Reveal";
import { art, archGarlands, archStars } from "./art";
import { Collage, type Tile } from "./Collage";
import { EventList, FaqList } from "../shared/EventList";
import { chosenLayout } from "../shared/layouts";
import { PhotoGallery } from "../shared/PhotoGallery";
import { Envelope } from "./Intro";
import { Petals } from "./Petals";
import { StoryCards } from "./StoryCards";
import { Toran } from "./Toran";

const THEMES = ["rani-gold", "marigold-ink", "pink-city", "pista-rose", "midnight-mehfil", "monsoon-mono"];
export const MODERN_INDIAN_THEMES = THEMES;

type P = { ctx: RenderContext; section: SiteSection; anchor: string };

// ───────────── small building blocks ─────────────

/** "Our story" → Our <em>story</em>: the design sets the last word (or a short last pair) in italic accent. */
function Emph({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  let cut = words.length - 1;
  const bare = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "");
  if (cut > 0 && bare(words[cut]).length <= 3) cut--;
  if (cut > 0 && /^(&|and)$/i.test(words[cut - 1])) cut--;
  if (cut === 0) cut = words.length - 1;
  return <>{words.slice(0, cut).join(" ")} <em>{words.slice(cut).join(" ")}</em></>;
}

/** Number, small label, heading and introduction, each editable and hideable. */
function Head({ ctx, section, anchor, name, intro = "intro" }: P & { name: string; intro?: string | null }) {
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  const introEl = intro ? el(section, intro) : null;
  return (
    <>
      <SectionEditChip ctx={ctx} section={section} name={name} />
      <div className="sec-head reveal">
        <p className="sec-kicker">
          <span className="sec-no" aria-hidden="true" />
          <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden} inline>
            <span className="mono-label">{eyebrow.text}</span>
          </Editable>
        </p>
        <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden} className="head-h2">
          <h2 id={`${anchor}-title`}><Emph text={heading.text ?? ""} /></h2>
        </Editable>
        {introEl ? (
          // The flex item is the editor's tap target in the editor, the paragraph itself on the site.
          <Editable ctx={ctx} section={section} field={intro!} label="Introduction" show={introEl.show} hidden={introEl.hidden} className="sec-intro">
            <p className={isEdit(ctx) ? undefined : "sec-intro"}>{introEl.text}</p>
          </Editable>
        ) : null}
      </div>
    </>
  );
}

function Sec({ section, anchor, alt = false, ink = false, className = "", children }: {
  section: SiteSection; anchor: string; alt?: boolean; ink?: boolean; className?: string; children: ReactNode;
}) {
  const heading = el(section, "heading");
  const cls = ["sec", alt && "sec-alt", ink && "sec-ink", className].filter(Boolean).join(" ");
  return (
    <section id={anchor} className={cls} aria-labelledby={heading.show ? `${anchor}-title` : undefined} data-section={section.key}>
      {children}
    </section>
  );
}

const ArrowOut = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
const CalendarIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>;

function SectionPhoto({ ctx, section }: { ctx: RenderContext; section: SiteSection }) {
  const img = imageEl(section.content);
  const url = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  return (
    <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!url} hidden={img.hidden}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sec-photo reveal" src={url ?? undefined} alt={img.alt ?? ""} loading="lazy" />
    </Editable>
  );
}

function Links({ ctx, section }: { ctx: RenderContext; section: SiteSection }) {
  const links = list<{ label?: string; url?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (links.length === 0 && !isEdit(ctx)) return null;
  return (
    <Editable ctx={ctx} section={section} field="links" label="Buttons" show={links.length > 0}>
      <div className="links reveal">
        {links.map((l, i) => <SiteLink key={i} ctx={ctx} href={safeHref(l.url)} className="btn btn-line btn-sm">{l.label}</SiteLink>)}
      </div>
    </Editable>
  );
}

const STORY_ART = [5, 2, 4, 3, 1];
const GALLERY_ART = [0, 1, 2, 4, 3, 5, 2];

// ───────────── hero ─────────────

function Hero({ ctx, section, rsvp, events }: { ctx: RenderContext; section: SiteSection; rsvp: SiteSection | null; events: SiteSection | null }) {
  const { couple } = ctx.site;
  const c = section.content;
  const eyebrow = el(section, "eyebrow");
  const tagline = el(section, "tagline");
  const joiner = el(section, "joiner");
  const lines = (["partnerOneFamily", "partnerOneDetails", "partnerTwoFamily", "partnerTwoDetails"] as const).map((k) => el(section, k));
  const img = imageEl(c);
  const photo = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  const day = weddingDay(ctx.site);
  const venue = ctx.site.events.find((e) => e.venue)?.venue;
  const place = venue ? (venue.city ?? venue.name) : null;
  const showDate = !bool(c, "hideDate") && !!day;
  const showPlace = !bool(c, "hideVenue") && !!place;
  const deadline = ctx.site.rsvp.enabled && ctx.site.rsvp.deadline ? ctx.site.rsvp.deadline : null;
  const rsvpLabel = rsvp ? el(rsvp, "eyebrow") : null;
  const eventsHeading = events ? el(events, "heading") : null;
  const ring = [showDate ? day!.long.toUpperCase() : null, showPlace ? place!.toUpperCase() : null].filter(Boolean).join(" • ");

  const family = (who: string, fam: typeof lines[0], det: typeof lines[0], famKey: string, detKey: string) => (
    <div>
      <p className="mono-label" aria-hidden="true">{who}</p>
      <Editable ctx={ctx} section={section} field={famKey} label={`${who}'s family line`} show={fam.show} hidden={fam.hidden}>
        <p>{fam.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field={detKey} label={`${who}'s second line`} show={det.show} hidden={det.hidden}>
        <p>{det.text}</p>
      </Editable>
    </div>
  );
  const anyFamily = lines.some((l) => l.show) || isEdit(ctx);

  return (
    <section className="hero" id="mi-hero" aria-label={names(ctx.site)}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <div className="hero-copy">
        <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
          <p className="kicker anim">{eyebrow.text}</p>
        </Editable>
        <h1 className="names" tabIndex={-1}>
          <span className="line anim">{couple.partnerOneName}</span>
          <span className="line anim">
            <Editable ctx={ctx} section={section} field="joiner" label="Word between the names" show={joiner.show} hidden={joiner.hidden} inline>
              <em>{joiner.text}</em>
            </Editable>
            {joiner.show ? null : " "}{couple.partnerTwoName}
          </span>
        </h1>
        {anyFamily ? (
          <div className="families anim">
            {family(couple.partnerOneName, lines[0], lines[1], "partnerOneFamily", "partnerOneDetails")}
            {family(couple.partnerTwoName, lines[2], lines[3], "partnerTwoFamily", "partnerTwoDetails")}
          </div>
        ) : null}
        <Editable ctx={ctx} section={section} field="tagline" label="Invitation line" show={tagline.show} hidden={tagline.hidden}>
          <p className="invite anim">{tagline.text}</p>
        </Editable>
        {showDate || showPlace || deadline ? (
          <Editable ctx={ctx} section={section} field="date" label="Date and place" show>
            <dl className="meta anim">
              {showDate ? <div><dt className="olv-sr">Date</dt><dd>{day!.dots}</dd></div> : null}
              {showPlace ? <div><dt className="olv-sr">Where</dt><dd>{place}</dd></div> : null}
              {deadline ? <div><dt className="olv-sr">Reply by</dt><dd><small>{rsvpLabels(rsvp?.content ?? {}).deadline}</small>{formatDate(deadline, { day: "numeric", month: "short" })}</dd></div> : null}
            </dl>
          </Editable>
        ) : null}
        {(rsvpLabel?.show && ctx.site.rsvp.enabled) || eventsHeading?.show ? (
          <div className="ctas anim">
            {rsvpLabel?.show && ctx.site.rsvp.enabled ? <SiteLink ctx={ctx} href="#rsvp" newTab={false} className="btn btn-fill">{rsvpLabel.text}</SiteLink> : null}
            {eventsHeading?.show && ctx.site.events.length ? <SiteLink ctx={ctx} href="#events" newTab={false} className="btn btn-line">{eventsHeading.text}</SiteLink> : null}
          </div>
        ) : null}
      </div>
      <div className="hero-art anim">
        <Editable ctx={ctx} section={section} field="image" label="Photo" show hidden={img.hidden}>
          <svg className="arch" viewBox="0 0 400 520" aria-hidden="true">
            <defs>
              <linearGradient id="mi-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" className="sk1" /><stop offset=".55" className="sk2" /><stop offset=".82" className="sk3" /><stop offset="1" className="sk4" />
              </linearGradient>
              <clipPath id="mi-arch-clip"><path d="M40 520 V200 C40 110 110 40 200 30 C290 40 360 110 360 200 V520Z" /></clipPath>
            </defs>
            <path className="arch-frame" d="M20 520 V196 C20 96 100 16 200 6 C300 16 380 96 380 196 V520Z" />
            <path className="arch-dash" d="M30 520 V198 C30 104 105 28 200 18 C295 28 370 104 370 198 V520" />
            <g clipPath="url(#mi-arch-clip)">
              {photo ? <image className="arch-photo" href={photo} width="400" height="520" preserveAspectRatio="xMidYMid slice" /> : (
                <>
                  <rect width="400" height="520" fill="url(#mi-sky)" />
                  <circle className="moon" cx="262" cy="150" r="26" />
                  <g className="stars" dangerouslySetInnerHTML={{ __html: archStars() }} />
                  <path className="palace" d="M40 520 V420 H70 V380 h8 v-14 a14 14 0 0 1 28 0 v14 h8 V420 H150 V360 c0 -30 22 -52 50 -62 c28 10 50 32 50 62 V420 H286 V380 h8 v-14 a14 14 0 0 1 28 0 v14 h8 V420 H360 V520Z" />
                  <path className="palace" d="M196 298 h8 v-22 h-8z M200 268 l-5 8 h10z" />
                  <g className="window"><rect x="186" y="380" width="28" height="40" rx="14" /><rect x="88" y="430" width="12" height="20" rx="6" /><rect x="300" y="430" width="12" height="20" rx="6" /><rect x="230" y="440" width="8" height="14" rx="4" /><rect x="162" y="440" width="8" height="14" rx="4" /></g>
                  <rect className="water" y="470" width="400" height="50" />
                  <g className="ripples"><path d="M150 486h40M210 486h46M120 500h30M240 500h50M170 510h60" /></g>
                  <g className="lantern-str"><path d="M110 30v80M300 20v68M160 20v50M250 20v34" /></g>
                  <g className="lantern"><path d="M104 110h12l-2 14h-8z" /><path d="M294 88h12l-2 14h-8z" /><path d="M155 70h10l-2 11h-6z" /><path d="M246 54h8l-1.5 9h-5z" /></g>
                </>
              )}
            </g>
            <g dangerouslySetInnerHTML={{ __html: archGarlands() }} />
          </svg>
        </Editable>
        {photo && img.alt ? <span className="olv-sr">{img.alt}</span> : null}
        <svg className="badge" viewBox="0 0 130 130" aria-hidden="true">
          <defs><path id="mi-circ" d="M65 65 m-50 0 a50 50 0 1 1 100 0 a50 50 0 1 1 -100 0" /></defs>
          <circle className="badge-bg" cx="65" cy="65" r="64" />
          {ring ? <g className="badge-spin"><text className="badge-ring"><textPath href="#mi-circ" textLength="308" lengthAdjust="spacing">{`${ring} • ${ring} •`}</textPath></text></g> : null}
          <text className="badge-mono" x="65" y="76" textAnchor="middle">{monogram(ctx)}</text>
        </svg>
      </div>
    </section>
  );
}

const initial = (s: string) => s.trim().slice(0, 1).toUpperCase();
const monogram = (ctx: RenderContext) => `${initial(ctx.site.couple.partnerOneName)}&${initial(ctx.site.couple.partnerTwoName)}`;

// ───────────── sections ─────────────

function Countdown({ ctx, section, anchor }: P) {
  const c = section.content;
  const target = countdownTarget(ctx.site);
  const heading = el(section, "heading");
  const day = weddingDay(ctx.site);
  const place = ctx.site.events.find((e) => e.venue)?.venue;
  if (!target && ctx.mode === "public") return null;
  const items = [names(ctx.site), heading.show ? heading.text : null, day?.long ?? null, place ? (place.city ?? place.name) : null].filter(Boolean) as string[];
  const units: [Parameters<typeof CountdownValue>[0]["unit"], string, string][] = [
    ["d", "daysUnit", "Days"], ["h", "hoursUnit", "Hours"], ["m", "minutesUnit", "Minutes"], ["s", "secondsUnit", "Seconds"],
  ];
  return (
    <section id={anchor} className="cd-wrap" data-section="countdown" aria-label={heading.show ? heading.text! : "Countdown"}>
      <SectionEditChip ctx={ctx} section={section} name="Countdown" />
      <Editable ctx={ctx} section={section} field="heading" label="Banner wording" show hidden={heading.hidden}>
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {Array.from({ length: 8 }, (_, k) => items.map((t, i) => <span key={`${k}-${i}`}>{t}<i>✺</i></span>))}
          </div>
        </div>
      </Editable>
      <Editable ctx={ctx} section={section} field="labels" label="Countdown wording" show>
        {target ? (
          <div className="countdown" role="timer" aria-label="Time until the wedding">
            {units.map(([u, key, fallback]) => (
              <div key={u}><b><CountdownValue target={target} unit={u} pad /></b><small>{labelOf(c, key, fallback)}</small></div>
            ))}
          </div>
        ) : <p className="countdown"><small>Add your wedding date to start the countdown.</small></p>}
      </Editable>
    </section>
  );
}

function Welcome({ ctx, section, anchor }: P) {
  const body = el(section, "body");
  const sign = el(section, "signature");
  if (!body.show && !sign.show && ctx.mode === "public" && !el(section, "heading").show) return null;
  return (
    <Sec section={section} anchor={anchor}>
      <Head ctx={ctx} section={section} anchor={anchor} name="Welcome note" intro={null} />
      <div className="letter reveal">
        <Editable ctx={ctx} section={section} field="body" label="Letter" show={body.show} hidden={body.hidden}>
          <p className="letter-body">{body.text}</p>
        </Editable>
        <Editable ctx={ctx} section={section} field="signature" label="Signature" show={sign.show} hidden={sign.hidden}>
          <p className="letter-sign">{sign.text} {names(ctx.site)}</p>
        </Editable>
      </div>
    </Sec>
  );
}

function SaveTheDate({ ctx, section, anchor }: P) {
  const c = section.content;
  const note = el(section, "note");
  const day = weddingDay(ctx.site);
  const events = weddingCalendar(ctx.site);
  if (!day && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor} alt>
      <Head ctx={ctx} section={section} anchor={anchor} name="Save the date" intro={null} />
      <div className="std reveal">
        <Editable ctx={ctx} section={section} field="note" label="Note" show={note.show} hidden={note.hidden}>
          <p className="mono-label">{note.text}</p>
        </Editable>
        {day ? (
          <>
            <p className="std-date">{day.long}</p>
            <p className="std-day">{day.weekday}{day.time ? ` · ${day.time}` : ""}</p>
          </>
        ) : <p className="std-day">{showPlaceholders(ctx) ? "Add your wedding date" : ""}</p>}
        {events.length > 0 ? (
          <Editable ctx={ctx} section={section} field="buttonLabel" label="Button wording" show>
            <AddToCalendar events={events} fileName={`${fileSlug(ctx.site)}-wedding`} className="btn btn-fill" disabled={isEdit(ctx)}>
              <CalendarIcon />{labelOf(c, "buttonLabel", "Save the date")}
            </AddToCalendar>
          </Editable>
        ) : null}
      </div>
    </Sec>
  );
}

type Chapter = { label?: string; title?: string; text?: string; ref?: string | null; alt?: string; colors?: string[] | null };

function Story({ ctx, section, anchor }: P) {
  const body = el(section, "body");
  const chapters = list<Chapter>(section.content, "chapters").filter((ch) => ch.title);
  const img = imageEl(section.content);
  if (!body.show && chapters.length === 0 && !img.ref && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor}>
      <Head ctx={ctx} section={section} anchor={anchor} name="Our story" intro={chapters.length ? "body" : null} />
      {chapters.length === 0 ? (
        <>
          <SectionPhoto ctx={ctx} section={section} />
          <Editable ctx={ctx} section={section} field="body" label="Story text" show={body.show} hidden={body.hidden}>
            <p className="body-text letter-body reveal">{body.text}</p>
          </Editable>
          {isEdit(ctx) ? <Editable ctx={ctx} section={section} field="chapters" label="Chapters" show={false} /> : null}
        </>
      ) : (
        <>
          {img.ref && !img.hidden ? <SectionPhoto ctx={ctx} section={section} /> : null}
          <StoryCards count={chapters.length}>
            {chapters.map((ch, i) => {
              const photo = ch.ref ? ctx.imageUrl({ ref: ch.ref }, "large") : null;
              return (
                <article className="story-card" key={i}>
                  <Editable ctx={ctx} section={section} field={`chapters.${i}`} label={`Chapter ${ch.title}`} show>
                    <div className="photo">
                      {photo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={photo} alt={ch.alt ?? ""} loading="lazy" />
                        : <span className="tile-art" dangerouslySetInnerHTML={{ __html: art(STORY_ART[i % 5], i + 1, `mi-st-${uid(section, i)}`) }} />}
                    </div>
                    {ch.label ? <p className="mono-label">{ch.label}</p> : null}
                    <h3>{ch.title}</h3>
                    {ch.text ? <p>{ch.text}</p> : null}
                  </Editable>
                </article>
              );
            })}
          </StoryCards>
        </>
      )}
    </Sec>
  );
}

function Events({ ctx, section, anchor }: P) {
  const c = section.content;
  const events = eventsFor(ctx.site);
  const showCal = bool(c, "showCalendar", true);
  const calLabel = labelOf(c, "calendarLabel", "Add to calendar");
  const dress = labelOf(c, "dressCodeLabel", "Dress code:");
  const layout = chosenLayout(section, "events", "modern-indian");
  return (
    <Sec section={section} anchor={anchor} alt>
      <Head ctx={ctx} section={section} anchor={anchor} name="Events" />
      {events.length === 0 ? (
        <Editable ctx={ctx} section={section} field="labels" label="Events wording" show>
          <p className="body-text">{labelOf(c, "emptyText", "Event details are coming soon.")}</p>
        </Editable>
      ) : layout ? <EventList ctx={ctx} section={section} layout={layout} /> : (
        <div className="events">
          {events.map((e, i) => {
            const end = e.endsAtLocal && e.endsAtLocal.slice(0, 10) === e.startsAtLocal.slice(0, 10) ? ` – ${timeOf(e.endsAtLocal)}` : "";
            return (
              <article className="event reveal" key={`${e.name}-${i}`} style={{ ["--ev" as string]: `var(--ev-${(i % 4) + 1})` }}>
                <Editable ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show>
                  {e.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="event-cover" src={ctx.imageUrl(e.cover, "large") ?? undefined} alt="" loading="lazy" />
                  ) : null}
                  <div className="event-top">
                    <span className="mono-label">{dateOf(e.startsAtLocal, { weekday: "short", day: "numeric", month: "short" })}</span>
                    <span className="event-no" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3>{e.name}</h3>
                  <p className="event-time"><time dateTime={e.startsAt}>{timeOf(e.startsAtLocal)}{end}</time></p>
                  {e.venue ? <p className="event-place">{e.venue.name}{e.venue.city ? <><br />{e.venue.city}</> : null}</p> : null}
                  {e.description || e.notes ? <p className="event-desc">{[e.description, e.notes].filter(Boolean).join(" ")}</p> : null}
                  {e.dressCode || showCal ? (
                    <div className="event-foot">
                      {e.dressCode ? <span className="chip">{dress} {e.dressCode}</span> : <span />}
                      {showCal ? (
                        <AddToCalendar events={[calendarEvent(ctx.site, e)]} fileName={`${fileSlug(ctx.site)}-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          className="cal-btn" disabled={isEdit(ctx)}>
                          + {calLabel}<span className="olv-sr">: {e.name}</span>
                        </AddToCalendar>
                      ) : null}
                    </div>
                  ) : null}
                </Editable>
              </article>
            );
          })}
        </div>
      )}
    </Sec>
  );
}

function Gallery({ ctx, section, anchor }: P) {
  const photos = ctx.site.gallery;
  if (photos.length === 0 && ctx.mode === "public") return null;
  const tiles: Tile[] = photos.length
    ? photos.map((p) => ({ src: ctx.imageUrl(p, "large") ?? undefined, alt: p.caption ?? "" }))
    : GALLERY_ART.map((t, i) => ({ alt: "", art: art(t, 20 + i, `mi-g-${uid(section, i)}`) }));
  const layout = chosenLayout(section, "gallery", "modern-indian");
  return (
    <Sec section={section} anchor={anchor}>
      <Head ctx={ctx} section={section} anchor={anchor} name="Gallery" />
      <Editable ctx={ctx} section={section} field="photos" label="Photos" show>
        {layout ? <PhotoGallery layout={layout} tiles={tiles} interactive={!isEdit(ctx) && photos.length > 0} className="reveal" />
          : <Collage tiles={tiles} interactive={!isEdit(ctx) && photos.length > 0} />}
      </Editable>
    </Sec>
  );
}

function Venue({ ctx, section, anchor, index }: P & { index: number }) {
  const c = section.content;
  const venues = venuesFor(ctx.site);
  if (venues.length === 0 && ctx.mode === "public") return null;
  const label = labelOf(c, "directionsLabel", "Open in Maps");
  return (
    <Sec section={section} anchor={anchor} alt>
      <Head ctx={ctx} section={section} anchor={anchor} name="Venue" />
      {venues.length === 0 ? (
        <Editable ctx={ctx} section={section} field="labels" label="Venue wording" show>
          <p className="body-text">{labelOf(c, "emptyText", "Add a venue to your events to show it here.")}</p>
        </Editable>
      ) : (
        <div className={`venues${venues.length > 1 ? " many" : ""}`}>
          {venues.map((v, i) => (
            <div key={i} className="reveal">
              <p className="mono-label">{v.events.join(" · ")}</p>
              <Editable ctx={ctx} section={section} field="directionsLabel" label="Map link wording" show>
                <MapCard ctx={ctx} href={mapsUrl(v)} name={v.name} address={venueLine(v)} label={label} id={`${uid(section, index)}-${i}`} />
              </Editable>
            </div>
          ))}
        </div>
      )}
    </Sec>
  );
}

type Item = { label?: string; title?: string; text?: string; url?: string; linkLabel?: string; ref?: string | null; alt?: string; colors?: string[] | null };

/**
 * Travel, things to do, dress code and thank you. Travel and things to do list their items as an accordion
 * (as the supplied "Venue & travel" section does); the dress code uses the design's colour-story rows.
 */
function InfoSection({ ctx, section, anchor, name, rows = false, alt = false }: P & { name: string; rows?: boolean; alt?: boolean }) {
  const body = el(section, "body");
  const items = list<Item>(section.content, "items").filter((i) => i.title);
  const img = imageEl(section.content);
  const links = list(section.content, "links");
  if (!body.show && items.length === 0 && !img.ref && links.length === 0 && ctx.mode === "public") return null;
  const itemBody = (item: Item) => {
    const href = safeHref(item.url);
    const photo = item.ref ? ctx.imageUrl({ ref: item.ref }, "large") : null;
    return { href, photo };
  };
  return (
    <Sec section={section} anchor={anchor} alt={alt}>
      <Head ctx={ctx} section={section} anchor={anchor} name={name} intro="body" />
      <SectionPhoto ctx={ctx} section={section} />
      {items.length === 0 ? (isEdit(ctx) ? <Editable ctx={ctx} section={section} field="items" label="Items" show={false} /> : null) : rows ? (
        <div className="dress">
          {items.map((item, i) => {
            const { href, photo } = itemBody(item);
            return (
              <Editable key={i} ctx={ctx} section={section} field={`items.${i}`} label={`Item ${item.title}`} show>
                <div className="dress-row reveal">
                  <div>
                    {item.label ? <p className="mono-label">{item.label}</p> : null}
                    <h3>{item.title}</h3>
                    <Swatches colors={item.colors} />
                    {item.text ? <p>{item.text}</p> : null}
                    {href ? <SiteLink ctx={ctx} href={href} className="t-link">{item.linkLabel || "Find out more"}<ArrowOut /></SiteLink> : null}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {photo ? <img className="row-photo" src={photo} alt={item.alt ?? ""} loading="lazy" /> : null}
                </div>
              </Editable>
            );
          })}
        </div>
      ) : (
        <div className="accordion reveal">
          {items.map((item, i) => {
            const { href, photo } = itemBody(item);
            return (
              <Editable key={i} ctx={ctx} section={section} field={`items.${i}`} label={`Item ${item.title}`} show>
                <details open={isEdit(ctx) || i === 0 || undefined}>
                  <summary><span>{item.label ? <span className="mono-label">{item.label}</span> : null}{item.title}</span></summary>
                  <div className="acc-body">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {photo ? <img className="item-photo" src={photo} alt={item.alt ?? ""} loading="lazy" /> : null}
                    <Swatches colors={item.colors} />
                    {item.text ? <p className="body-text">{item.text}</p> : null}
                    {href ? <SiteLink ctx={ctx} href={href} className="t-link">{item.linkLabel || "Find out more"}<ArrowOut /></SiteLink> : null}
                  </div>
                </details>
              </Editable>
            );
          })}
        </div>
      )}
      <Links ctx={ctx} section={section} />
    </Sec>
  );
}

function Faq({ ctx, section, anchor }: P) {
  const items = list<{ question?: string; answer?: string }>(section.content, "items").filter((i) => i.question && i.answer);
  if (items.length === 0 && ctx.mode === "public") return null;
  const faqLayout = chosenLayout(section, "faq", "modern-indian");
  return (
    <Sec section={section} anchor={anchor}>
      <Head ctx={ctx} section={section} anchor={anchor} name="FAQ" />
      {faqLayout ? <FaqList ctx={ctx} section={section} items={items} layout={faqLayout} /> : <Editable ctx={ctx} section={section} field="items" label="Questions" show={items.length > 0}>
        <div className="accordion reveal">
          {items.map((item, i) => (
            <details key={i} open={isEdit(ctx) || undefined}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </Editable>}
    </Sec>
  );
}

function Registry({ ctx, section, anchor }: P) {
  const intro = el(section, "intro");
  const heading = el(section, "heading");
  const eyebrow = el(section, "eyebrow");
  const links = list<{ label?: string; url?: string; description?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (!intro.show && links.length === 0 && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor}>
      <SectionEditChip ctx={ctx} section={section} name="Gift registry" />
      <aside className="gifts reveal">
        <svg viewBox="0 0 24 24" className="gift-ic" aria-hidden="true"><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M3 9h18v-3H3zM12 6v14" /><path d="M12 6C10 2 6 3 8 6M12 6c2-4 6-3 4 0" /></svg>
        <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
          <p className="mono-label">{eyebrow.text}</p>
        </Editable>
        <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
          <h3 id={`${anchor}-title`}>{heading.text}</h3>
        </Editable>
        <Editable ctx={ctx} section={section} field="intro" label="Introduction" show={intro.show} hidden={intro.hidden}>
          <p>{intro.text}</p>
        </Editable>
        {links.length || isEdit(ctx) ? (
          <Editable ctx={ctx} section={section} field="links" label="Registry links" show={links.length > 0}>
            <div className="gift-links">
              {links.map((l, i) => (
                <div key={i}>
                  <h4>{l.label}</h4>
                  {l.description ? <p>{l.description}</p> : null}
                  <SiteLink ctx={ctx} href={safeHref(l.url)} className="t-link">View<span className="olv-sr"> {l.label}</span><ArrowOut /></SiteLink>
                </div>
              ))}
            </div>
          </Editable>
        ) : null}
      </aside>
    </Sec>
  );
}

function WeddingParty({ ctx, section, anchor }: P) {
  const members = list<{ name?: string; role?: string; bio?: string; ref?: string }>(section.content, "members").filter((m) => m.name);
  if (members.length === 0 && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor} alt>
      <Head ctx={ctx} section={section} anchor={anchor} name="Wedding party" />
      {members.length === 0 ? <Editable ctx={ctx} section={section} field="members" label="People" show={false} /> : (
        <ul className="people">
          {members.map((m, i) => {
            const photo = m.ref ? ctx.imageUrl({ ref: m.ref }, "thumb") : null;
            return (
              <li key={i} className="person reveal">
                <Editable ctx={ctx} section={section} field={`members.${i}`} label={`Person ${m.name}`} show>
                  {photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photo} alt="" loading="lazy" />
                    : <span className="initial" aria-hidden="true">{initial(m.name!)}</span>}
                  {m.role ? <p className="mono-label">{m.role}</p> : null}
                  <h3>{m.name}</h3>
                  {m.bio ? <p>{m.bio}</p> : null}
                </Editable>
              </li>
            );
          })}
        </ul>
      )}
    </Sec>
  );
}

function Contact({ ctx, section, anchor }: P) {
  const note = el(section, "note");
  const email = ctx.site.contact?.email ?? null;
  const phone = ctx.site.contact?.phone ?? null;
  if (!note.show && !email && !phone && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor}>
      <Head ctx={ctx} section={section} anchor={anchor} name="Contact" intro={null} />
      <Editable ctx={ctx} section={section} field="note" label="Note" show={note.show} hidden={note.hidden}>
        <p className="body-text reveal">{note.text}</p>
      </Editable>
      {email || phone || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="details" label="Contact details" show={!!(email || phone)}>
          <div className="links reveal">
            {email ? <SiteLink ctx={ctx} href={`mailto:${email}`} newTab={false} className="btn btn-line btn-sm">{email}</SiteLink> : null}
            {phone ? <SiteLink ctx={ctx} href={`tel:${phone.replace(/[^+\d]/g, "")}`} newTab={false} className="btn btn-line btn-sm">{phone}</SiteLink> : null}
          </div>
        </Editable>
      ) : null}
    </Sec>
  );
}

/** A video the couple uploaded, in the design's section frame with the accent heading. */
function Video({ ctx, section, anchor }: P) {
  const v = videoOf(section);
  if (!v.src && ctx.mode === "public") return null;
  const body = el(section, "body");
  return (
    <Sec section={section} anchor={anchor}>
      <Head ctx={ctx} section={section} anchor={anchor} name="Video" intro={null} />
      <Editable ctx={ctx} section={section} field="body" label="Description" show={body.show} hidden={body.hidden}>
        <p className="body-text reveal olv-video-desc">{body.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="video" label="Video" show>
        <VideoBlockView ctx={ctx} video={v} title={el(section, "heading").text ?? "Video"} className="reveal" />
      </Editable>
    </Sec>
  );
}

function Custom({ ctx, section, anchor }: P) {
  if (customIsEmpty(ctx, section) && ctx.mode === "public") return null;
  return (
    <Sec section={section} anchor={anchor}>
      <Head ctx={ctx} section={section} anchor={anchor} name="Custom section" intro={null} />
      <CustomBlocks ctx={ctx} section={section} className="custom-blocks reveal" />
    </Sec>
  );
}

function Rsvp({ ctx, section, anchor }: P) {
  const rsvp = ctx.site.rsvp;
  const labels = rsvpLabels(section.content);
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  const intro = el(section, "intro");
  return (
    <Sec section={section} anchor={anchor} ink>
      <SectionEditChip ctx={ctx} section={section} name="RSVP" />
      <div className="rsvp">
        <div className="rsvp-intro reveal">
          <span className="sec-no" aria-hidden="true" />
          <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden} inline>
            <span className="mono-label"> {eyebrow.text}</span>
          </Editable>
          <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
            <h2 id={`${anchor}-title`}><Emph text={heading.text ?? ""} /></h2>
          </Editable>
          <Editable ctx={ctx} section={section} field="intro" label="Introduction" show={intro.show} hidden={intro.hidden}>
            <p>{intro.text}</p>
          </Editable>
          {rsvp.deadline ? (
            <Editable ctx={ctx} section={section} field="labels.deadline" label="Reply-by wording" show>
              <p className="rsvp-contact">{labels.deadline} <b>{formatDate(rsvp.deadline)}</b>.</p>
            </Editable>
          ) : null}
        </div>
        <div className="rsvp-card reveal">
          {!rsvp.isOpen && ctx.mode !== "edit" ? <p className="rsvp-closed">{labels.closed}</p> : (
            <Editable ctx={ctx} section={section} field="labels" label="RSVP form" show>
              <RsvpBlock ctx={ctx} labels={labels} />
            </Editable>
          )}
        </div>
      </div>
    </Sec>
  );
}

function Footer({ ctx, section }: { ctx: RenderContext; section: SiteSection | null }) {
  const line = section ? textEl(section.content, "line") : { text: null, hidden: false };
  const badge = section ? footerBadge(section.content) : { text: FOOTER_BADGE_DEFAULT, hidden: false };
  const day = weddingDay(ctx.site);
  const place = ctx.site.events.find((e) => e.venue)?.venue;
  const meta = [day?.dots, place ? (place.city ?? place.name) : null].filter(Boolean).join(" — ");
  const { couple } = ctx.site;
  const body = (
    <>
      <div className="foot-mono" aria-hidden="true"><span>{initial(couple.partnerOneName)}<em>&amp;</em>{initial(couple.partnerTwoName)}</span></div>
      {!line.hidden ? <p className="foot-names">{line.text ?? <>{couple.partnerOneName} <em>&amp;</em> {couple.partnerTwoName}</>}</p> : null}
      {meta ? <p className="mono-label">{meta}</p> : null}
    </>
  );
  return (
    <footer className="footer">
      {section ? (
        <Editable ctx={ctx} section={section} field="line" label="Closing line" show>{body}</Editable>
      ) : body}
      {ctx.shareSlot ? <div className="foot-share">{ctx.shareSlot}</div> : null}
      {section ? (
        <Editable ctx={ctx} section={section} field="badge" label="Footer note" show={!badge.hidden && !!badge.text} hidden={badge.hidden}>
          <p className="foot-badge">{badge.text}</p>
        </Editable>
      ) : <p className="foot-badge">{badge.text}</p>}
    </footer>
  );
}

// ───────────── the design ─────────────

/** Modern Indian: a wax-sealed envelope opens onto a festive palace website (6 colour themes). No section menu. */
export function ModernIndian(ctx: RenderContext) {
  const { site } = ctx;
  const theme = THEMES.includes(site.theme.palette.key) ? site.theme.palette.key : "rani-gold";
  const rootId = "olv-mi-root";
  const pageId = "olv-mi-page";
  const intro = ctx.mode !== "edit";
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
  const heroEl = hero ? el(hero, "eyebrow") : null;
  const joiner = hero ? el(hero, "joiner") : null;
  const day = weddingDay(site);

  const render = (s: SiteSection, i: number): ReactNode => {
    const key = s.id ?? `${s.key}-${i}`;
    const props = { ctx, section: s, anchor: anchorFor(s) };
    switch (s.key) {
      case "countdown": return <Countdown key={key} {...props} />;
      case "welcome": return <Welcome key={key} {...props} />;
      case "save_the_date": return <SaveTheDate key={key} {...props} />;
      case "story": return <Story key={key} {...props} />;
      case "events": return <Events key={key} {...props} />;
      case "gallery": return <Gallery key={key} {...props} />;
      case "venue": return <Venue key={key} {...props} index={i} />;
      case "travel": return <InfoSection key={key} {...props} name="Travel & stay" />;
      case "explore": return <InfoSection key={key} {...props} name="Things to do" alt />;
      case "dress_code": return <InfoSection key={key} {...props} name="Dress code" rows />;
      case "thank_you": return <InfoSection key={key} {...props} name="Thank you" />;
      case "faq": return <Faq key={key} {...props} />;
      case "registry": return <Registry key={key} {...props} />;
      case "wedding_party": return <WeddingParty key={key} {...props} />;
      case "contact": return <Contact key={key} {...props} />;
      case "video": return <Video key={key} {...props} />;
      case "custom": return <Custom key={key} {...props} />;
      case "rsvp": return <Rsvp key={key} {...props} />;
      default: return null; // hero and footer are placed explicitly; unknown types are ignored
    }
  };

  const music = site.music;
  const audio = music?.audio ? ctx.imageUrl({ ref: music.audio.ref }, "audio") : null;
  return (
    <div className="olv-mi" id={rootId} data-theme={theme} data-mode={ctx.mode}>
      <DesignAssets design="modern-indian" files={["design.css", `theme-${theme}.css`]} theme={theme} />
      {intro ? (
        <Envelope pageId={pageId} storageKey={ctx.mode === "public" ? `${site.template.key}:${names(site)}` : null}
          kicker={heroEl?.show ? heroEl.text : null} names={[site.couple.partnerOneName, site.couple.partnerTwoName]}
          joiner={joiner?.show ? joiner.text! : "&"} date={day?.dots ?? null} monogram={monogram(ctx)} />
      ) : null}
      {music && music.position === "top-right" ? <MusicButton music={music} src={audio} accent={site.theme.palette.accent} edit={isEdit(ctx)} /> : null}
      <div className={`page${intro ? "" : " ready"}`} id={pageId}>
        <Toran />
        <div className="mi-main">
          {hero ? <Hero ctx={ctx} section={hero} rsvp={rsvpSection} events={eventsSection} /> : <h1 className="olv-sr" tabIndex={-1}>{names(site)}</h1>}
          {site.sections.map(render)}
        </div>
        <Footer ctx={ctx} section={footer} />
      </div>
      {music && music.position !== "top-right" ? <MusicButton music={music} src={audio} accent={site.theme.palette.accent} edit={isEdit(ctx)} /> : null}
      {intro ? <Petals /> : null}
      {ctx.mode !== "edit" ? <RevealObserver rootId={rootId} /> : null}
    </div>
  );
}
