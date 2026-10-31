import { bool, imageEl, label as labelOf } from "../../content";
import { Editable, SectionEditChip, SiteLink } from "../../Editable";
import type { RenderContext } from "../../types";
import { CountdownValue } from "../shared/Countdown";
import {
  countdownTarget, dateOf, el, isEdit, names, timeOf, uid, weddingDay, eventsFor,
} from "../shared/data";
import {
  CalButton, EventCover, Frame, InfoSection, Media, NoEvents, SectionPhoto, StoryText, chaptersOf, classicDesign, eventLabels, type Kit, type P,
} from "../classic/Classic";
import { art, branch, sprig } from "./art";

function PanelCountdown({ ctx }: { ctx: RenderContext }) {
  const section = ctx.site.sections.find((s) => s.key === "countdown");
  const target = countdownTarget(ctx.site);
  if (!section || (!target && ctx.mode === "public")) return null;
  const c = section.content;
  const heading = el(section, "heading");
  return (
    <div className="cd-wrap" id="countdown" data-section="countdown">
      <SectionEditChip ctx={ctx} section={section} name="Countdown" />
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
        <p className="lab cd-title">{heading.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="labels" label="Countdown wording" show>
        {target ? (
          <p className="cd" role="timer" aria-label="Time until the wedding">
            {([["d", "daysUnit", "Days"], ["h", "hoursUnit", "Hours"], ["m", "minutesUnit", "Minutes"]] as const).map(([u, key, fb]) => (
              <span key={u}><b><CountdownValue target={target} unit={u} pad /></b> {labelOf(c, key, fb)}</span>
            ))}
          </p>
        ) : <p className="cd">Add your wedding date to start the countdown.</p>}
      </Editable>
    </div>
  );
}

/** The side panel: names, date, countdown and RSVP, with branches growing in from the corners. */
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
  const place = !bool(c, "hideVenue") && venue ? [venue.name, venue.city].filter(Boolean).join(" · ") : null;
  const rsvpLabel = rsvp ? el(rsvp, "eyebrow") : null;
  const families = lines.some((l) => l.show) || isEdit(ctx);
  const family = (who: string, fam: typeof lines[0], det: typeof lines[0], famKey: string, detKey: string) => (
    <div>
      <Editable ctx={ctx} section={section} field={famKey} label={`${who}'s family line`} show={fam.show} hidden={fam.hidden}><p>{fam.text}</p></Editable>
      <Editable ctx={ctx} section={section} field={detKey} label={`${who}'s second line`} show={det.show} hidden={det.hidden}><p className="det">{det.text}</p></Editable>
    </div>
  );
  return (
    <aside className="panel" id="top" aria-label={names(ctx.site)}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <svg className="branch b1" viewBox="0 0 300 300" aria-hidden="true" dangerouslySetInnerHTML={{ __html: branch(3) }} />
      <svg className="branch b2" viewBox="0 0 300 300" aria-hidden="true" dangerouslySetInnerHTML={{ __html: branch(9) }} />
      <div className="panel-in">
        <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!photo} hidden={img.hidden}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="panel-photo" src={photo ?? undefined} alt={img.alt ?? ""} />
        </Editable>
        <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
          <p className="lab">{eyebrow.text}</p>
        </Editable>
        <h1 className="names" tabIndex={-1}>
          {couple.partnerOneName}
          <Editable ctx={ctx} section={section} field="joiner" label="Word between the names" show={joiner.show} hidden={joiner.hidden} inline>
            <em>{joiner.text}</em>
          </Editable>
          {joiner.show ? null : <span className="olv-sr"> &amp; </span>}
          {couple.partnerTwoName}
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
            {day ? <p className="when">{day.weekday}, {day.long}</p> : null}
            {place ? <p className="lab dark">{place}</p> : null}
          </Editable>
        ) : null}
        <PanelCountdown ctx={ctx} />
        {rsvpLabel?.show && ctx.site.rsvp.enabled ? <SiteLink ctx={ctx} href="#rsvp" newTab={false} className="btn">{rsvpLabel.text}</SiteLink> : null}
      </div>
    </aside>
  );
}

/** The welcome letter, signed, with the garden pavilion plate below it. */
function Welcome(p: P) {
  const { ctx, section, kit } = p;
  const body = el(section, "body");
  const sign = el(section, "signature");
  const img = imageEl(section.content);
  const photo = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  if (!body.show && !sign.show && ctx.mode === "public" && !el(section, "heading").show) return null;
  return (
    <Frame {...p} name="Welcome note" intro={null}>
      <div className="letter reveal">
        <Editable ctx={ctx} section={section} field="body" label="Letter" show={body.show} hidden={body.hidden}>
          <p className="cl-letter-body">{body.text}</p>
        </Editable>
        <Editable ctx={ctx} section={section} field="signature" label="Signature" show={sign.show} hidden={sign.hidden}>
          <p className="sig">{sign.text}<br /><span>{names(ctx.site)}</span></p>
        </Editable>
      </div>
      <Editable ctx={ctx} section={section} field="image" label="Photo" show hidden={img.hidden}>
        <div className="plate reveal"><Media src={photo} alt={img.alt} art={kit.art("plate", 0, `eg-pl-${uid(section, p.index)}`, ctx)} /></div>
      </Editable>
    </Frame>
  );
}

/** Our story as a timeline of round vignettes. */
function Story(p: P) {
  const { ctx, section, kit } = p;
  const chapters = chaptersOf(section);
  const body = el(section, "body");
  if (!body.show && chapters.length === 0 && !imageEl(section.content).ref && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Our story" intro={chapters.length ? "body" : null}>
      {chapters.length === 0 ? <StoryText {...p} /> : (
        <>
          {imageEl(section.content).ref ? <SectionPhoto ctx={ctx} section={section} /> : null}
          <ol className="timeline">
            {chapters.map((ch, i) => (
              <li key={i} className="reveal">
                <Editable ctx={ctx} section={section} field={`chapters.${i}`} label={`Chapter ${ch.title}`} show className="tl-edit">
                  <div className="tl-row">
                    <div className="dot"><Media src={ch.ref ? ctx.imageUrl({ ref: ch.ref }, "thumb") : null} alt={ch.alt} art={kit.art("story", i, `eg-st-${uid(section, i)}`, ctx)} /></div>
                    <div>
                      {ch.label ? <p className="lab">{ch.label}</p> : null}
                      <h3>{ch.title}</h3>
                      {ch.text ? <p>{ch.text}</p> : null}
                    </div>
                  </div>
                </Editable>
              </li>
            ))}
          </ol>
        </>
      )}
    </Frame>
  );
}

/** Order of the day: times on the left, each event with its place and notes. */
function Events(p: P) {
  const { ctx, section } = p;
  const events = eventsFor(ctx.site);
  const l = eventLabels(section);
  const many = new Set(events.map((e) => e.startsAtLocal.slice(0, 10))).size > 1;
  return (
    <Frame {...p} name="Events">
      {events.length === 0 ? <NoEvents ctx={ctx} section={section} /> : (
        <div className="order reveal">
          {events.map((e, i) => (
            <Editable key={`${e.name}-${i}`} ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show className="order-edit">
              <div className="order-row">
                <b><time dateTime={e.startsAt}>{many ? <>{dateOf(e.startsAtLocal, { day: "numeric", month: "short" })}<br /></> : null}{timeOf(e.startsAtLocal)}</time></b>
                <div>
                  <EventCover ctx={ctx} e={e} className="order-cover" />
                  <h3>{e.name}</h3>
                  {e.venue ? <p>{[e.venue.name, e.venue.city].filter(Boolean).join(", ")}</p> : null}
                  {e.description || e.notes ? <p>{[e.description, e.notes].filter(Boolean).join(" ")}</p> : null}
                  {e.dressCode ? <p className="note">{l.dress} {e.dressCode}</p> : null}
                  {l.showCal ? <CalButton ctx={ctx} e={e} label={l.cal} className="btn sm line" /> : null}
                </div>
              </div>
            </Editable>
          ))}
        </div>
      )}
    </Frame>
  );
}

const kit: Kit = {
  design: "english-garden",
  root: "olv-eg",
  head: { wrapper: "head", eyebrow: "lab", intro: "intro-p" },
  tone: (key) => (key === "rsvp" ? "rsvp-sec" : ""),
  art,
  gallery: "grid",
  Hero,
  split: true,
  introMs: 3000,
  sections: {
    countdown: () => null, // shown in the side panel
    welcome: Welcome,
    story: Story,
    events: Events,
    travel: (p) => <InfoSection {...p} name="Travel & stay" variant="cards" />,
    explore: (p) => <InfoSection {...p} name="Things to do" variant="cards" artFor="tile" />,
    dress_code: (p) => <InfoSection {...p} name="Dress code" variant="cards" />,
  },
  footerArt: () => <svg viewBox="0 0 120 40" className="sprig" aria-hidden="true" dangerouslySetInnerHTML={{ __html: sprig }} />,
};

/** English Garden: a country-house garden in sage, olive and blush; the side panel stays while the page scrolls. */
export const EnglishGarden = classicDesign(kit);
