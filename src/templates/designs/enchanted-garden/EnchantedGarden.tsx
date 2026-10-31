import type { ReactNode } from "react";
import type { SiteSection } from "@/lib/api/types";
import { FOOTER_BADGE_DEFAULT, bool, footerBadge, imageEl, label as labelOf, list, rsvpLabels, safeHref, textEl } from "../../content";
import { Editable, SectionEditChip, SiteLink } from "../../Editable";
import { CustomBlocks, customIsEmpty } from "../../sections/Custom";
import { VideoBlockView, videoOf } from "../shared/VideoBlockView";
import type { RenderContext } from "../../types";
import { formatDate } from "@/lib/utils/format";
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
import { defs, slideArt } from "./art";
import { Carousel, type Slide } from "./Carousel";
import { EventList, FaqList } from "../shared/EventList";
import { chosenLayout } from "../shared/layouts";
import { PhotoGallery } from "../shared/PhotoGallery";
import { Intro } from "./Intro";
import { Garden, Valance } from "./Scenery";
import { ScratchCover } from "./Scratch";
import { RsvpBlock } from "../../rsvp/RsvpBlock";

const THEMES = ["sage-garden", "soft-pastel", "warm-earthy", "light-minimal", "bold-modern", "dark-luxury"];
export const ENCHANTED_GARDEN_THEMES = THEMES;

type P = { ctx: RenderContext; section: SiteSection; anchor: string };

// ───────────── small building blocks ─────────────

const ICONS: Record<string, ReactNode> = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  dress: <path d="M9 3l3 2 3-2 5 3-2 4-2-1v12H8V9l-2 1-2-4z" />,
  car: <><path d="M5 16V11l2-5h10l2 5v5z" /><path d="M5 11h14" /><circle cx="8" cy="16" r="1.6" /><circle cx="16" cy="16" r="1.6" /><path d="M6 16v2M18 16v2" /></>,
  hotel: <><rect x="6" y="3" width="12" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3" /></>,
  gift: <><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M3 9h18v-3H3zM12 6v14" /><path d="M12 6C10 2 6 3 8 6M12 6c2-4 6-3 4 0" /></>,
  mail: <><rect x="3" y="6" width="18" height="13" rx="1.5" /><path d="M3 7l9 6 9-6" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>,
  people: <><circle cx="9" cy="8" r="3" /><circle cx="16" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 14.5c3 0 7 1.5 7 5" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return <svg className="sec-icon reveal" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;
}

function Divider({ reveal = true }: { reveal?: boolean }) {
  return <div className={`divider${reveal ? " reveal" : ""}`} aria-hidden="true"><span /><i>&#9829;</i><span /></div>;
}

/** Small label + script title + heart divider: every element editable and hideable. */
function Title({ ctx, section, anchor, name, icon }: P & { name: string; icon?: keyof typeof ICONS }) {
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  return (
    <>
      {icon ? <Icon name={icon} /> : null}
      <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
        <p className="eyebrow reveal">{eyebrow.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
        <h2 id={`${anchor}-title`} className="script-title reveal">{heading.text}</h2>
      </Editable>
      {heading.show || eyebrow.show ? <Divider /> : null}
      <SectionEditChip ctx={ctx} section={section} name={name} />
    </>
  );
}

function SectionIntro({ ctx, section, field = "intro" }: { ctx: RenderContext; section: SiteSection; field?: string }) {
  const intro = el(section, field);
  return (
    <Editable ctx={ctx} section={section} field={field} label="Introduction" show={intro.show} hidden={intro.hidden}>
      <p className="sec-intro reveal">{intro.text}</p>
    </Editable>
  );
}

function Frame({ section, anchor, card = false, className = "", children, labelled = true }: P & {
  card?: boolean; className?: string; children: ReactNode; labelled?: boolean;
}) {
  const heading = el(section, "heading");
  return (
    <section id={anchor} className={`section${card ? " card" : ""}${className ? ` ${className}` : ""}`}
      aria-labelledby={labelled && heading.show ? `${anchor}-title` : undefined} data-section={section.key}>
      {children}
    </section>
  );
}

type Item = { label?: string; title?: string; text?: string; url?: string; linkLabel?: string; ref?: string | null; alt?: string; colors?: string[] | null };

function InfoItems({ ctx, section, items, field = "items" }: { ctx: RenderContext; section: SiteSection; items: Item[]; field?: string }) {
  return (
    <>
      {items.map((item, i) => {
        const photo = item.ref ? ctx.imageUrl({ ref: item.ref }, "large") : null;
        const href = safeHref(item.url);
        return (
          <Editable key={i} ctx={ctx} section={section} field={`${field}.${i}`} label={`Item ${item.title ?? i + 1}`} show>
            <div className="info-block reveal">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="info-photo" src={photo} alt={item.alt ?? ""} loading="lazy" />
              ) : null}
              {item.label ? <p className="info-label">{item.label}</p> : null}
              <h3>{item.title}</h3>
              <Swatches colors={item.colors} />
              {item.text ? <p>{item.text}</p> : null}
              {href ? <SiteLink ctx={ctx} href={href} className="t-link">{item.linkLabel || "Find out more"}<LinkArrow /></SiteLink> : null}
            </div>
          </Editable>
        );
      })}
    </>
  );
}

const LinkArrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
const CalendarIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>;

function Links({ ctx, section }: { ctx: RenderContext; section: SiteSection }) {
  const links = list<{ label?: string; url?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (links.length === 0 && !isEdit(ctx)) return null;
  return (
    <Editable ctx={ctx} section={section} field="links" label="Buttons" show={links.length > 0}>
      <div className="info-links reveal">
        {links.map((l, i) => <SiteLink key={i} ctx={ctx} href={safeHref(l.url)} className="btn-dark small">{l.label}</SiteLink>)}
      </div>
    </Editable>
  );
}

function SectionImage({ ctx, section, className }: { ctx: RenderContext; section: SiteSection; className: string }) {
  const img = imageEl(section.content);
  const url = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  return (
    <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!url} hidden={img.hidden}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${className} reveal`} src={url ?? undefined} alt={img.alt ?? ""} loading="lazy" />
    </Editable>
  );
}

// ───────────── sections ─────────────

function Hero({ ctx, section, heroId, opened }: { ctx: RenderContext; section: SiteSection; heroId: string; opened: boolean }) {
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
  const when = [!bool(c, "hideDate") && day ? day.long : null, !bool(c, "hideVenue") && venue ? (venue.city ?? venue.name) : null].filter(Boolean).join(" · ");

  const person = (name: string, family: typeof lines[0], details: typeof lines[0], fam: string, det: string, who: string) => (
    <>
      <p className="name" aria-hidden="true">{name}</p>
      <Editable ctx={ctx} section={section} field={fam} label={`${who}'s family line`} show={family.show} hidden={family.hidden}>
        <p className="parents">{family.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field={det} label={`${who}'s second line`} show={details.show} hidden={details.hidden}>
        <p className="parents">{details.text}</p>
      </Editable>
    </>
  );

  return (
    <section className={`hero${opened ? " opened" : ""}`} id={heroId} aria-label={names(ctx.site)}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <Valance />
      <svg className="drape drape-left" viewBox="0 0 120 520" preserveAspectRatio="none" aria-hidden="true"><use href="#eg-drape" /></svg>
      <svg className="drape drape-right" viewBox="0 0 120 520" preserveAspectRatio="none" aria-hidden="true"><use href="#eg-drape" /></svg>
      <div className="hero-text">
        <h1 className="olv-sr" tabIndex={-1}>{names(ctx.site)}</h1>
        <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!photo} hidden={img.hidden} placeholderWhenEmpty={false}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-photo" src={photo ?? undefined} alt={img.alt ?? ""} />
        </Editable>
        <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
          <p className="hero-kicker">{eyebrow.text}</p>
        </Editable>
        <Divider reveal={false} />
        {person(couple.partnerOneName, lines[0], lines[1], "partnerOneFamily", "partnerOneDetails", couple.partnerOneName)}
        <Editable ctx={ctx} section={section} field="joiner" label="Word between the names" show={joiner.show} hidden={joiner.hidden}>
          <div className="amp" aria-hidden="true">{joiner.text}</div>
        </Editable>
        {person(couple.partnerTwoName, lines[2], lines[3], "partnerTwoFamily", "partnerTwoDetails", couple.partnerTwoName)}
        <Editable ctx={ctx} section={section} field="tagline" label="Invitation line" show={tagline.show} hidden={tagline.hidden}>
          <p className="hero-tagline">{tagline.text}</p>
        </Editable>
        {when ? (
          <Editable ctx={ctx} section={section} field="date" label="Date and place" show>
            <p className="hero-when">{when}</p>
          </Editable>
        ) : null}
      </div>
      <Garden />
      <div className="curtain curtain-left" aria-hidden="true" />
      <div className="curtain curtain-right" aria-hidden="true" />
    </section>
  );
}

function Welcome({ ctx, section, anchor }: P) {
  const body = el(section, "body");
  const sign = el(section, "signature");
  if (!body.show && !sign.show && ctx.mode === "public" && !el(section, "heading").show) return null;
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} className="welcome">
      <Title ctx={ctx} section={section} anchor={anchor} name="Welcome note" />
      <Editable ctx={ctx} section={section} field="body" label="Letter" show={body.show} hidden={body.hidden}>
        <p className="welcome-text reveal">{body.text} <span className="heart-ink" aria-hidden="true">&#9829;</span></p>
      </Editable>
      <Editable ctx={ctx} section={section} field="signature" label="Signature" show={sign.show} hidden={sign.hidden}>
        <p className="welcome-sign reveal">{sign.text}<br />{names(ctx.site)}</p>
      </Editable>
    </Frame>
  );
}

function SaveTheDate({ ctx, section, anchor }: P) {
  const c = section.content;
  const note = el(section, "note");
  const day = weddingDay(ctx.site);
  const scratch = bool(c, "scratch", true) && ctx.mode !== "edit" && !!day;
  const hint = labelOf(c, "scratchHint", "Scratch the heart to reveal the date");
  const button = labelOf(c, "buttonLabel", "Save the date");
  const events = weddingCalendar(ctx.site);
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} className="scratch-section">
      <canvas className="confetti" aria-hidden="true" />
      <Title ctx={ctx} section={section} anchor={anchor} name="Save the date" />
      {scratch ? <p className="scratch-hint reveal">{hint}</p> : null}
      <div className="scratch-wrap reveal">
        <div className="heart-card">
          <svg viewBox="0 0 240 220" className="heart-outline" aria-hidden="true"><path d="M120 206 C 60 160, 10 120, 10 66 C 10 32, 36 10, 66 10 C 92 10, 110 26, 120 46 C 130 26, 148 10, 174 10 C 204 10, 230 32, 230 66 C 230 120, 180 160, 120 206 Z" /></svg>
          <div className="heart-info">
            <Editable ctx={ctx} section={section} field="note" label="Note" show={note.show} hidden={note.hidden}>
              <p className="hi-small">{note.text}</p>
            </Editable>
            {day ? (
              <>
                <p className="hi-date">{day.long}</p>
                <p className="hi-day">{day.weekday}</p>
                {day.time ? <p className="hi-time">{day.time}</p> : null}
              </>
            ) : <p className="hi-date">{showPlaceholders(ctx) ? "Add your wedding date" : ""}</p>}
          </div>
        </div>
        {scratch ? <ScratchCover sectionId={anchor} hint={`Reveal the date: ${day?.long ?? ""}`} /> : null}
      </div>
      {events.length > 0 ? (
        <Editable ctx={ctx} section={section} field="buttonLabel" label="Button wording" show>
          <AddToCalendar events={events} fileName={`${fileSlug(ctx.site)}-wedding`} className="btn-dark reveal" disabled={isEdit(ctx)}>
            <CalendarIcon />{button.toUpperCase()}
          </AddToCalendar>
        </Editable>
      ) : null}
    </Frame>
  );
}

function Gallery({ ctx, section, anchor }: P) {
  const photos = ctx.site.gallery;
  if (photos.length === 0 && ctx.mode === "public") return null;
  const slides: Slide[] = photos.length
    ? photos.map((p) => ({ src: ctx.imageUrl(p, "large") ?? undefined, alt: p.caption ?? "" }))
    : [0, 1, 2, 3].map((i) => ({ art: slideArt(i) }));
  const layout = chosenLayout(section, "gallery", "enchanted-garden");
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} className="gallery-section">
      <div style={{ width: "100%" }}>
        <Title ctx={ctx} section={section} anchor={anchor} name="Gallery" />
        <SectionIntro ctx={ctx} section={section} />
        <Editable ctx={ctx} section={section} field="photos" label="Photos" show>
          {layout ? (
            <div className="reveal"><PhotoGallery layout={layout} interactive={!isEdit(ctx) && photos.length > 0}
              tiles={slides.map((sl) => ({ src: sl.src, alt: sl.alt ?? "", art: sl.art ? `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${sl.art}</svg>` : undefined }))} /></div>
          ) : (
            <div className="reveal"><Carousel slides={slides} autoplay={!isEdit(ctx)} interactive={!isEdit(ctx) && photos.length > 0} /></div>
          )}
        </Editable>
      </div>
    </Frame>
  );
}

function Countdown({ ctx, section, anchor }: P) {
  const c = section.content;
  const target = countdownTarget(ctx.site);
  if (!target && ctx.mode === "public") return null;
  const units: [Parameters<typeof CountdownValue>[0]["unit"], string, string][] = [
    ["d", "daysUnit", "Days"], ["h", "hoursUnit", "Hours"], ["m", "minutesUnit", "Minutes"], ["s", "secondsUnit", "Seconds"],
  ];
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} className="countdown-section">
      <Title ctx={ctx} section={section} anchor={anchor} name="Countdown" />
      <Editable ctx={ctx} section={section} field="labels" label="Countdown wording" show>
        {target ? (
          <div className="countdown reveal" role="timer" aria-label="Time until the wedding">
            {units.map(([u, key, fallback]) => (
              <div className="cd" key={u}><b><CountdownValue target={target} unit={u} /></b><small>{labelOf(c, key, fallback).toUpperCase()}</small></div>
            ))}
          </div>
        ) : <p className="sec-intro">Add your wedding date to start the countdown.</p>}
      </Editable>
    </Frame>
  );
}

function Events({ ctx, section, anchor }: P) {
  const c = section.content;
  const events = eventsFor(ctx.site);
  const showCal = bool(c, "showCalendar", true);
  const calLabel = labelOf(c, "calendarLabel", "Add to calendar");
  const dress = labelOf(c, "dressCodeLabel", "Dress code:");
  const layout = chosenLayout(section, "events", "enchanted-garden");
  return (
    <Frame ctx={ctx} section={section} anchor={anchor}>
      <Title ctx={ctx} section={section} anchor={anchor} name="Events" icon="clock" />
      <SectionIntro ctx={ctx} section={section} />
      {events.length === 0 ? (
        <Editable ctx={ctx} section={section} field="labels" label="Events wording" show>
          <p className="sec-intro">{labelOf(c, "emptyText", "Event details are coming soon.")}</p>
        </Editable>
      ) : layout ? <EventList ctx={ctx} section={section} layout={layout} /> : (
        <ul className="timeline">
          {events.map((e, i) => {
            const cover = e.cover ? ctx.imageUrl(e.cover, "large") : null;
            const end = e.endsAtLocal && e.endsAtLocal.slice(0, 10) === e.startsAtLocal.slice(0, 10) ? ` – ${timeOf(e.endsAtLocal)}` : "";
            return (
              <li className="reveal" key={`${e.name}-${i}`}>
                <Editable ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="t-cover" src={cover} alt="" loading="lazy" />
                  ) : null}
                  <h3>{e.name}</h3>
                  <p className="t-date"><time dateTime={e.startsAt}>{dateOf(e.startsAtLocal)}, {timeOf(e.startsAtLocal)}{end}</time></p>
                  {e.venue ? <p className="t-venue">{e.venue.name}{e.venue.city ? `, ${e.venue.city}` : ""}</p> : null}
                  {e.description ? <p className="t-note">{e.description}</p> : null}
                  {e.dressCode ? <p className="t-note">{dress} {e.dressCode}</p> : null}
                  {e.notes ? <p className="t-note">{e.notes}</p> : null}
                  {showCal ? (
                    <AddToCalendar events={[calendarEvent(ctx.site, e)]} fileName={`${fileSlug(ctx.site)}-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="t-link" disabled={isEdit(ctx)}>
                      <CalendarIcon />{calLabel}<span className="olv-sr">: {e.name}</span>
                    </AddToCalendar>
                  ) : null}
                </Editable>
              </li>
            );
          })}
        </ul>
      )}
    </Frame>
  );
}

function Venue({ ctx, section, anchor, index }: P & { index: number }) {
  const c = section.content;
  const venues = venuesFor(ctx.site);
  if (venues.length === 0 && ctx.mode === "public") return null;
  const label = labelOf(c, "directionsLabel", "Open in Maps");
  return (
    <Frame ctx={ctx} section={section} anchor={anchor}>
      <Title ctx={ctx} section={section} anchor={anchor} name="Venue" icon="pin" />
      <SectionIntro ctx={ctx} section={section} />
      {venues.length === 0 ? (
        <Editable ctx={ctx} section={section} field="labels" label="Venue wording" show>
          <p className="sec-intro">{labelOf(c, "emptyText", "Add a venue to your events to show it here.")}</p>
        </Editable>
      ) : venues.map((v, i) => (
        <div key={i} className="reveal" style={{ marginTop: i ? 34 : 0 }}>
          {venues.length > 1 ? <p className="t-label" style={{ marginBottom: 8 }}>{v.events.join(" · ")}</p> : null}
          <Editable ctx={ctx} section={section} field="directionsLabel" label="Map link wording" show>
            <MapCard ctx={ctx} href={mapsUrl(v)} name={v.name} address={venueLine(v)} label={label} id={`${uid(section, index)}-${i}`} />
          </Editable>
        </div>
      ))}
    </Frame>
  );
}

/** Travel, dress code, things to do, thank you: text, items, photo and buttons on a card. */
function InfoSection({ ctx, section, anchor, name, icon }: P & { name: string; icon: keyof typeof ICONS }) {
  const body = el(section, "body");
  const items = list<Item>(section.content, "items").filter((i) => i.title);
  const img = imageEl(section.content);
  const links = list(section.content, "links");
  if (!body.show && items.length === 0 && !img.ref && links.length === 0 && ctx.mode === "public") return null;
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} card>
      <Title ctx={ctx} section={section} anchor={anchor} name={name} icon={icon} />
      <SectionImage ctx={ctx} section={section} className="info-photo" />
      <Editable ctx={ctx} section={section} field="body" label="Text" show={body.show} hidden={body.hidden}>
        <p className="body-text reveal" style={{ marginBottom: items.length ? 20 : 0 }}>{body.text}</p>
      </Editable>
      {items.length ? <InfoItems ctx={ctx} section={section} items={items} /> : isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="items" label="Items" show={false} />
      ) : null}
      <Links ctx={ctx} section={section} />
    </Frame>
  );
}

function Story({ ctx, section, anchor }: P) {
  const body = el(section, "body");
  const chapters = list<Item & { label?: string }>(section.content, "chapters").filter((ch) => ch.title);
  const img = imageEl(section.content);
  if (!body.show && chapters.length === 0 && !img.ref && ctx.mode === "public") return null;
  return (
    <Frame ctx={ctx} section={section} anchor={anchor}>
      <Title ctx={ctx} section={section} anchor={anchor} name="Our story" icon="book" />
      <SectionImage ctx={ctx} section={section} className="story-photo" />
      <Editable ctx={ctx} section={section} field="body" label="Story text" show={body.show} hidden={body.hidden}>
        <p className="story-body reveal">{body.text}</p>
      </Editable>
      {chapters.length ? (
        <ul className="timeline story-chapters">
          {chapters.map((ch, i) => {
            const photo = ch.ref ? ctx.imageUrl({ ref: ch.ref }, "large") : null;
            return (
              <li className="reveal" key={i}>
                <Editable ctx={ctx} section={section} field={`chapters.${i}`} label={`Chapter ${ch.title}`} show>
                  {ch.label ? <p className="t-label">{ch.label}</p> : null}
                  <h3>{ch.title}</h3>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="t-cover" src={photo} alt={ch.alt ?? ""} loading="lazy" />
                  ) : null}
                  {ch.text ? <p className="t-date" style={{ whiteSpace: "pre-line" }}>{ch.text}</p> : null}
                </Editable>
              </li>
            );
          })}
        </ul>
      ) : isEdit(ctx) ? <Editable ctx={ctx} section={section} field="chapters" label="Chapters" show={false} /> : null}
    </Frame>
  );
}

function Registry({ ctx, section, anchor }: P) {
  const intro = el(section, "intro");
  const links = list<{ label?: string; url?: string; description?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (!intro.show && links.length === 0 && ctx.mode === "public") return null;
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} card>
      <Title ctx={ctx} section={section} anchor={anchor} name="Gift registry" icon="gift" />
      <Editable ctx={ctx} section={section} field="intro" label="Introduction" show={intro.show} hidden={intro.hidden}>
        <p className="body-text reveal">{intro.text}</p>
      </Editable>
      {links.length || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="links" label="Registry links" show={links.length > 0}>
          <div style={{ marginTop: 18 }}>
            {links.map((l, i) => (
              <div className="info-block reveal" key={i}>
                <h3>{l.label}</h3>
                {l.description ? <p>{l.description}</p> : null}
                <SiteLink ctx={ctx} href={safeHref(l.url)} className="btn-dark small">View<span className="olv-sr"> {l.label}</span></SiteLink>
              </div>
            ))}
          </div>
        </Editable>
      ) : null}
    </Frame>
  );
}

function Faq({ ctx, section, anchor }: P) {
  const items = list<{ question?: string; answer?: string }>(section.content, "items").filter((i) => i.question && i.answer);
  if (items.length === 0 && ctx.mode === "public") return null;
  const faqLayout = chosenLayout(section, "faq", "enchanted-garden");
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} card>
      <Title ctx={ctx} section={section} anchor={anchor} name="FAQ" icon="question" />
      <SectionIntro ctx={ctx} section={section} />
      {faqLayout ? <FaqList ctx={ctx} section={section} items={items} layout={faqLayout} /> : <Editable ctx={ctx} section={section} field="items" label="Questions" show={items.length > 0}>
        <div className="faq reveal">
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

function WeddingParty({ ctx, section, anchor }: P) {
  const members = list<{ name?: string; role?: string; bio?: string; ref?: string }>(section.content, "members").filter((m) => m.name);
  if (members.length === 0 && ctx.mode === "public") return null;
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} card>
      <Title ctx={ctx} section={section} anchor={anchor} name="Wedding party" icon="people" />
      <SectionIntro ctx={ctx} section={section} />
      {members.length === 0 ? <Editable ctx={ctx} section={section} field="members" label="People" show={false} /> : (
        <ul className="party">
          {members.map((m, i) => {
            const photo = m.ref ? ctx.imageUrl({ ref: m.ref }, "thumb") : null;
            return (
              <li key={i} className="reveal">
                <Editable ctx={ctx} section={section} field={`members.${i}`} label={`Person ${m.name}`} show>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="party-photo" src={photo} alt="" loading="lazy" />
                  ) : <span className="party-initial" aria-hidden="true">{m.name!.slice(0, 1).toUpperCase()}</span>}
                  <h3>{m.name}</h3>
                  {m.role ? <p className="role">{m.role}</p> : null}
                  {m.bio ? <p className="bio">{m.bio}</p> : null}
                </Editable>
              </li>
            );
          })}
        </ul>
      )}
    </Frame>
  );
}

function Contact({ ctx, section, anchor }: P) {
  const note = el(section, "note");
  const email = ctx.site.contact?.email ?? null;
  const phone = ctx.site.contact?.phone ?? null;
  if (!note.show && !email && !phone && ctx.mode === "public") return null;
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} card>
      <Title ctx={ctx} section={section} anchor={anchor} name="Contact" icon="phone" />
      <Editable ctx={ctx} section={section} field="note" label="Note" show={note.show} hidden={note.hidden}>
        <p className="body-text reveal">{note.text}</p>
      </Editable>
      {email || phone || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="details" label="Contact details" show={!!(email || phone)}>
          <div className="info-links reveal">
            {email ? <SiteLink ctx={ctx} href={`mailto:${email}`} newTab={false} className="btn-dark small">{email}</SiteLink> : null}
            {phone ? <SiteLink ctx={ctx} href={`tel:${phone.replace(/[^+\d]/g, "")}`} newTab={false} className="btn-dark small">{phone}</SiteLink> : null}
          </div>
        </Editable>
      ) : null}
    </Frame>
  );
}

/** A video the couple uploaded: the garden card with the title, an optional description and the player. */
function Video({ ctx, section, anchor }: P) {
  const v = videoOf(section);
  if (!v.src && ctx.mode === "public") return null;
  const body = el(section, "body");
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} card>
      <Title ctx={ctx} section={section} anchor={anchor} name="Video" icon="spark" />
      <Editable ctx={ctx} section={section} field="body" label="Description" show={body.show} hidden={body.hidden}>
        <p className="body-text reveal olv-video-desc">{body.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="video" label="Video" show>
        <VideoBlockView ctx={ctx} video={v} title={el(section, "heading").text ?? "Video"} className="reveal" />
      </Editable>
    </Frame>
  );
}

function Custom({ ctx, section, anchor }: P) {
  if (customIsEmpty(ctx, section) && ctx.mode === "public") return null;
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} card>
      <Title ctx={ctx} section={section} anchor={anchor} name="Custom section" icon="spark" />
      <CustomBlocks ctx={ctx} section={section} className="custom-blocks reveal" />
    </Frame>
  );
}

function Rsvp({ ctx, section, anchor }: P) {
  const rsvp = ctx.site.rsvp;
  const labels = rsvpLabels(section.content);
  return (
    <Frame ctx={ctx} section={section} anchor={anchor} className="rsvp">
      <Title ctx={ctx} section={section} anchor={anchor} name="RSVP" icon="mail" />
      <SectionIntro ctx={ctx} section={section} />
      {rsvp.deadline ? (
        <Editable ctx={ctx} section={section} field="labels.deadline" label="Reply-by wording" show>
          <p className="rsvp-deadline reveal">{labels.deadline} <strong>{formatDate(rsvp.deadline)}</strong>.</p>
        </Editable>
      ) : null}
      <div className="reveal">
        {!rsvp.isOpen && ctx.mode !== "edit" ? (
          <p className="rsvp-note">{labels.closed}</p>
        ) : (
          <Editable ctx={ctx} section={section} field="labels" label="RSVP form" show>
            <RsvpBlock ctx={ctx} labels={labels} />
          </Editable>
        )}
      </div>
    </Frame>
  );
}

function Footer({ ctx, section }: { ctx: RenderContext; section: SiteSection | null }) {
  const line = section ? textEl(section.content, "line") : { text: null, hidden: false };
  const badge = section ? footerBadge(section.content) : { text: FOOTER_BADGE_DEFAULT, hidden: false };
  const day = weddingDay(ctx.site);
  const body = (
    <>
      <Divider reveal={false} />
      {!line.hidden ? <p className="script-title sm">{line.text ?? names(ctx.site)}</p> : null}
      {day ? <p className="foot-date">{day.dots}</p> : null}
    </>
  );
  return (
    <footer className="footer">
      {section ? (
        <Editable ctx={ctx} section={section} field="line" label="Closing line" show={!line.hidden || !!day} hidden={line.hidden && !day}>
          {body}
        </Editable>
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

/** Enchanted Garden: doors open onto curtains and an illustrated garden (6 colour themes). */
export function EnchantedGarden(ctx: RenderContext) {
  const { site } = ctx;
  const theme = THEMES.includes(site.theme.palette.key) ? site.theme.palette.key : "sage-garden";
  const rootId = "olv-eg-root";
  const heroId = "olv-eg-hero";
  const pageId = "olv-eg-page";
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

  const render = (s: SiteSection, i: number): ReactNode => {
    const key = s.id ?? `${s.key}-${i}`;
    const props = { ctx, section: s, anchor: anchorFor(s) };
    switch (s.key) {
      case "welcome": return <Welcome key={key} {...props} />;
      case "save_the_date": return <SaveTheDate key={key} {...props} />;
      case "gallery": return <Gallery key={key} {...props} />;
      case "countdown": return <Countdown key={key} {...props} />;
      case "events": return <Events key={key} {...props} />;
      case "venue": return <Venue key={key} {...props} index={i} />;
      case "story": return <Story key={key} {...props} />;
      case "travel": return <InfoSection key={key} {...props} name="Travel & stay" icon="hotel" />;
      case "dress_code": return <InfoSection key={key} {...props} name="Dress code" icon="dress" />;
      case "explore": return <InfoSection key={key} {...props} name="Things to do" icon="compass" />;
      case "thank_you": return <InfoSection key={key} {...props} name="Thank you" icon="heart" />;
      case "registry": return <Registry key={key} {...props} />;
      case "faq": return <Faq key={key} {...props} />;
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
    <div className="olv-eg" id={rootId} data-theme={theme} data-mode={ctx.mode}>
      <DesignAssets design="enchanted-garden" files={["design.css", `theme-${theme}.css`]} theme={theme} />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: defs() }} />
      {intro ? <Intro heroId={heroId} pageId={pageId} storageKey={ctx.mode === "public" ? `${site.template.key}:${names(site)}` : null} label="Tap to open" /> : null}
      {music && music.position === "top-right" ? <MusicButton music={music} src={audio} accent={site.theme.palette.accent} edit={isEdit(ctx)} /> : null}
      <div className="page" id={pageId}>
        {hero ? <Hero ctx={ctx} section={hero} heroId={heroId} opened={!intro} /> : null}
        <div className="content">
          {site.sections.map(render)}
          <Footer ctx={ctx} section={footer} />
        </div>
      </div>
      {music && music.position !== "top-right" ? <MusicButton music={music} src={audio} accent={site.theme.palette.accent} edit={isEdit(ctx)} /> : null}
      {ctx.mode !== "edit" ? <RevealObserver rootId={rootId} /> : null}
    </div>
  );
}
