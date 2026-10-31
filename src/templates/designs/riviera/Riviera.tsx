import { bool, imageEl, label as labelOf, rsvpLabels } from "../../content";
import { formatDate } from "@/lib/utils/format";
import { Editable, SectionEditChip, SiteLink } from "../../Editable";
import type { RenderContext } from "../../types";
import { CountdownValue } from "../shared/Countdown";
import {
  countdownTarget, dateOf, el, isEdit, mainEvent, names, timeOf, uid, weddingDay, eventsFor,
} from "../shared/data";
import { CalButton, Emph, EventCover, Frame, InfoSection, Media, NoEvents, RsvpBody, classicDesign, eventLabels, type Kit, type P } from "../classic/Classic";
import { DayTabs } from "../classic/Tabs";
import { art, coast } from "./art";

/** Full-bleed coastline (or the couple's photo) with the names over it. */
function Hero({ ctx, section, rsvp }: Parameters<Kit["Hero"]>[0]) {
  const { couple } = ctx.site;
  const c = section.content;
  const eyebrow = el(section, "eyebrow");
  const tagline = el(section, "tagline");
  const joiner = el(section, "joiner");
  const lines = (["partnerOneFamily", "partnerOneDetails", "partnerTwoFamily", "partnerTwoDetails"] as const).map((k) => el(section, k));
  const img = imageEl(c);
  const photo = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  const day = !bool(c, "hideDate") ? weddingDay(ctx.site) : null;
  const venue = ctx.site.events.find((e) => e.venue)?.venue;
  const place = !bool(c, "hideVenue") && venue ? [venue.name, venue.city].filter(Boolean).join(", ") : null;
  const rsvpLabel = rsvp ? el(rsvp, "eyebrow") : null;
  const families = lines.some((l) => l.show) || isEdit(ctx);
  const family = (who: string, fam: typeof lines[0], det: typeof lines[0], famKey: string, detKey: string) => (
    <div>
      <Editable ctx={ctx} section={section} field={famKey} label={`${who}'s family line`} show={fam.show} hidden={fam.hidden}><p>{fam.text}</p></Editable>
      <Editable ctx={ctx} section={section} field={detKey} label={`${who}'s second line`} show={det.show} hidden={det.hidden}><p className="det">{det.text}</p></Editable>
    </div>
  );
  return (
    <section className="hero" id="home" aria-label={names(ctx.site)}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <div className="hero-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo} alt={img.alt ?? ""} /> : <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: coast() }} />}
      </div>
      <div className="shade" aria-hidden="true" />
      <div className="copy">
        <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
          <p className="lab">{eyebrow.text}</p>
        </Editable>
        <h1 tabIndex={-1}>
          {couple.partnerOneName}{" "}
          <Editable ctx={ctx} section={section} field="joiner" label="Word between the names" show={joiner.show} hidden={joiner.hidden} inline>
            <span>{joiner.text}</span>
          </Editable>
          {joiner.show ? null : <span className="olv-sr"> &amp; </span>}
          <br />{couple.partnerTwoName}
        </h1>
        {families ? (
          <div className="families">
            {family(couple.partnerOneName, lines[0], lines[1], "partnerOneFamily", "partnerOneDetails")}
            {family(couple.partnerTwoName, lines[2], lines[3], "partnerTwoFamily", "partnerTwoDetails")}
          </div>
        ) : null}
        <Editable ctx={ctx} section={section} field="tagline" label="Invitation line" show={tagline.show} hidden={tagline.hidden}>
          <p className="tagline">{tagline.text}</p>
        </Editable>
        {day || place ? (
          <Editable ctx={ctx} section={section} field="date" label="Date and place" show>
            <p className="lab">{[day?.long, place].filter(Boolean).join(" · ")}</p>
          </Editable>
        ) : null}
      </div>
      {rsvpLabel?.show && ctx.site.rsvp.enabled ? <SiteLink ctx={ctx} href="#rsvp" newTab={false} className="hero-btn">{rsvpLabel.text}</SiteLink> : null}
      {isEdit(ctx) ? (
        <div className="hero-photo-edit">
          <Editable ctx={ctx} section={section} field="image" label="Photo behind the names" show={!!photo} hidden={img.hidden} photo={false}>
            <span className="olv-edit-chip">📷 Change the photo behind the names</span>
          </Editable>
        </div>
      ) : null}
    </section>
  );
}

/** Key facts under the hero: the day, the main event, the venue and (with a countdown section) the countdown. */
function Bar(ctx: RenderContext) {
  const hero = ctx.site.sections.find((s) => s.key === "hero");
  const hc = hero?.content ?? {};
  const day = !bool(hc, "hideDate") ? weddingDay(ctx.site) : null;
  const main = mainEvent(ctx.site);
  const venue = !bool(hc, "hideVenue") ? main?.venue ?? ctx.site.events.find((e) => e.venue)?.venue : null;
  const cd = ctx.site.sections.find((s) => s.key === "countdown") ?? null;
  const target = countdownTarget(ctx.site);
  const facts: [string, string][] = [];
  if (day) facts.push([day.weekday, day.long]);
  if (main) facts.push([main.name, timeOf(main.startsAtLocal)]);
  if (venue) facts.push([venue.city ?? venue.name, venue.name]);
  const heading = cd ? el(cd, "heading") : null;
  const showCd = !!cd && (!!target || ctx.mode !== "public");
  if (!facts.length && !showCd) return null;
  return (
    <div className={`bar n${facts.length + (showCd ? 1 : 0)}`}>
      {facts.map(([small, big], i) => <div key={i}><small>{small}</small><b>{big}</b></div>)}
      {showCd && cd ? (
        <div id="countdown" data-section="countdown">
          <SectionEditChip ctx={ctx} section={cd} name="Countdown" />
          <Editable ctx={ctx} section={cd} field="heading" label="Heading" show={!!heading?.show} hidden={heading?.hidden}>
            <small>{heading?.text}</small>
          </Editable>
          <Editable ctx={ctx} section={cd} field="labels" label="Countdown wording" show>
            {target ? (
              <b role="timer" aria-label="Time until the wedding"><CountdownValue target={target} unit="d" pad /> {labelOf(cd.content, "daysUnit", "Days").toLowerCase()} <CountdownValue target={target} unit="h" pad /> {labelOf(cd.content, "hoursUnit", "Hours").toLowerCase()}</b>
            ) : <b>Add your date</b>}
          </Editable>
        </div>
      ) : null}
    </div>
  );
}

/** Welcome: the heading beside the letter in two columns, then a wide picture. */
function Welcome(p: P) {
  const { ctx, section, anchor, kit, index } = p;
  const body = el(section, "body");
  const sign = el(section, "signature");
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  const img = imageEl(section.content);
  const photo = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  if (!body.show && !sign.show && ctx.mode === "public" && !heading.show) return null;
  const paras = (body.text ?? "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  return (
    <section id={anchor} className="sec" data-section="welcome" aria-labelledby={heading.show ? `${anchor}-title` : undefined}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome note" />
      <div className="wel">
        <div className="reveal">
          <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}><p className="lab t">{eyebrow.text}</p></Editable>
          <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}><h2 id={`${anchor}-title`}><Emph text={heading.text ?? ""} /></h2></Editable>
        </div>
        <div className={`${(body.text?.length ?? 0) > 360 ? "cols " : ""}reveal`}>
          <Editable ctx={ctx} section={section} field="body" label="Letter" show={body.show} hidden={body.hidden}>
            <div className="letter">{paras.map((t, i) => <p key={i}>{t}</p>)}</div>
          </Editable>
          <Editable ctx={ctx} section={section} field="signature" label="Signature" show={sign.show} hidden={sign.hidden}>
            <p className="sign">{sign.text} {names(ctx.site)}</p>
          </Editable>
        </div>
      </div>
      <Editable ctx={ctx} section={section} field="image" label="Photo" show hidden={img.hidden}>
        <div className="wide reveal"><Media src={photo} alt={img.alt} art={kit.art("plate", index, `rv-w-${uid(section, index)}`, ctx)} /></div>
      </Editable>
    </section>
  );
}

/** The weekend: one tab per day, each event with its time, place, attire and calendar button. */
function Events(p: P) {
  const { ctx, section } = p;
  const events = eventsFor(ctx.site);
  const l = eventLabels(section);
  const byDay = new Map<string, number[]>();
  events.forEach((e, i) => { const d = e.startsAtLocal.slice(0, 10); byDay.set(d, [...(byDay.get(d) ?? []), i]); });
  const days = [...byDay.entries()].map(([d, idx]) => ({
    key: d,
    small: dateOf(d, { weekday: "long" }),
    label: dateOf(d, { day: "numeric", month: "short" }),
    content: idx.map((i) => {
      const e = events[i];
      return (
        <Editable key={i} ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show>
          <article className="ev">
            <span className="time"><time dateTime={e.startsAt}>{timeOf(e.startsAtLocal)}</time></span>
            <div>
              <EventCover ctx={ctx} e={e} className="ev-cover" />
              <h3>{e.name}</h3>
              {e.venue || e.description ? <p>{[e.venue ? [e.venue.name, e.venue.city].filter(Boolean).join(", ") : null, e.description].filter(Boolean).join(" · ")}</p> : null}
              {e.notes ? <p>{e.notes}</p> : null}
              {e.dressCode ? <p className="attire">{l.dress} {e.dressCode}</p> : null}
            </div>
            {l.showCal ? <CalButton ctx={ctx} e={e} label={`+ ${l.cal}`} className="cal" /> : <span />}
          </article>
        </Editable>
      );
    }),
  }));
  const heading = el(section, "heading");
  return (
    <Frame {...p} name="Events">
      {events.length === 0 ? <NoEvents ctx={ctx} section={section} /> : (
        <div className="tabs reveal"><DayTabs days={days} all={isEdit(ctx)} label={heading.text ?? "Days"} /></div>
      )}
    </Frame>
  );
}

/** RSVP: a navy side with the invitation to reply, the form on sand. */
function Rsvp({ ctx, section, anchor }: P) {
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  const intro = el(section, "intro");
  const email = ctx.site.contact?.email ?? null;
  const labels = rsvpLabels(section.content);
  return (
    <section id={anchor} className="rsvp-wrap" data-section="rsvp" aria-labelledby={heading.show ? `${anchor}-title` : undefined}>
      <SectionEditChip ctx={ctx} section={section} name="RSVP" />
      <div className="rsvp-side reveal">
        <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}><p className="lab">{eyebrow.text}</p></Editable>
        <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}><h2 id={`${anchor}-title`}><Emph text={heading.text ?? ""} /></h2></Editable>
        <Editable ctx={ctx} section={section} field="intro" label="Introduction" show={intro.show} hidden={intro.hidden}><p className="rsvp-intro">{intro.text}</p></Editable>
        {ctx.site.rsvp.deadline ? (
          <Editable ctx={ctx} section={section} field="labels.deadline" label="Reply-by wording" show>
            <p className="deadline">{labels.deadline} <b>{formatDate(ctx.site.rsvp.deadline)}</b></p>
          </Editable>
        ) : null}
        {email ? <p className="small"><SiteLink ctx={ctx} href={`mailto:${email}`} newTab={false}>{email}</SiteLink></p> : null}
      </div>
      <div className="rsvp-main">
        <RsvpBody ctx={{ ...ctx, site: { ...ctx.site, rsvp: { ...ctx.site.rsvp, deadline: null } } }} section={section} />
      </div>
    </section>
  );
}

const SAND = new Set(["events", "explore", "story", "wedding_party"]);

const kit: Kit = {
  design: "riviera",
  root: "olv-rv",
  head: { wrapper: "head", eyebrow: "lab t", emph: true, intro: "cl-intro" },
  tone: (key) => (SAND.has(key) ? "sand" : ""),
  art,
  gallery: "masonry",
  Hero,
  afterHero: Bar,
  introMs: 3400,
  sections: {
    countdown: () => null, // in the bar under the hero
    welcome: Welcome,
    events: Events,
    rsvp: Rsvp,
    travel: (p) => <InfoSection {...p} name="Travel & stay" variant="trio" />,
    explore: (p) => <InfoSection {...p} name="Things to do" variant="grid4" artFor="tile" />,
    dress_code: (p) => <InfoSection {...p} name="Dress code" variant="trio" />,
    thank_you: (p) => <InfoSection {...p} name="Thank you" variant="trio" />,
  },
};

/** Riviera: a destination weekend by the sea in navy, white, sand and terracotta. */
export const Riviera = classicDesign(kit);
