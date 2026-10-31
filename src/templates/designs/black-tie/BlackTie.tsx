import { bool, imageEl } from "../../content";
import { Editable, SectionEditChip, SiteLink } from "../../Editable";
import { CountdownValue } from "../shared/Countdown";
import {
  countdownTarget, dateOf, el, isEdit, names, uid, eventsFor,
} from "../shared/data";
import { label as labelOf } from "../../content";
import {
  CalButton, EventCover, Frame, InfoSection, Media, NoEvents, StoryText, chaptersOf, classicDesign, eventLabels, roman, romanDate,
  timeSpan, type Kit, type P,
} from "../classic/Classic";
import { art, fan, rays } from "./art";

const DARK = new Set(["story", "travel", "rsvp", "venue", "contact"]);

function Hero({ ctx, section, rsvp }: Parameters<Kit["Hero"]>[0]) {
  const { couple } = ctx.site;
  const c = section.content;
  const eyebrow = el(section, "eyebrow");
  const tagline = el(section, "tagline");
  const joiner = el(section, "joiner");
  const lines = (["partnerOneFamily", "partnerOneDetails", "partnerTwoFamily", "partnerTwoDetails"] as const).map((k) => el(section, k));
  const img = imageEl(c);
  const photo = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  const date = !bool(c, "hideDate") ? romanDate(ctx.site) : null;
  const venue = ctx.site.events.find((e) => e.venue)?.venue;
  const place = !bool(c, "hideVenue") && venue ? [venue.name, venue.city].filter(Boolean).join(" · ") : null;
  const rsvpLabel = rsvp ? el(rsvp, "eyebrow") : null;
  const families = lines.some((l) => l.show) || isEdit(ctx);
  const family = (who: string, fam: typeof lines[0], det: typeof lines[0], famKey: string, detKey: string) => (
    <div>
      <Editable ctx={ctx} section={section} field={famKey} label={`${who}'s family line`} show={fam.show} hidden={fam.hidden}>
        <p>{fam.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field={detKey} label={`${who}'s second line`} show={det.show} hidden={det.hidden}>
        <p className="dim">{det.text}</p>
      </Editable>
    </div>
  );
  return (
    <section className="hero" id="home" aria-label={names(ctx.site)}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <svg className="rays" viewBox="0 0 1200 800" aria-hidden="true" dangerouslySetInnerHTML={{ __html: rays() }} />
      <div className="frame">
        <span className="arch a1" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo ? <img className="arch-photo" src={photo} alt="" /> : null}
        </span>
        <span className="arch a2" aria-hidden="true" />
        <svg className="crown" viewBox="0 0 200 70" aria-hidden="true"><path d="M20 66 L100 22 L180 66" /><path d="M44 66 L100 36 L156 66" className="thin" /><path className="gem" d="M100 2 l11 17 -11 17 -11 -17z" /></svg>
        <div className="frame-in">
          <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
            <p className="cap gold">{eyebrow.text}</p>
          </Editable>
          <h1 className="hnames" tabIndex={-1}>
            <span className="hname">{couple.partnerOneName}</span>
            <Editable ctx={ctx} section={section} field="joiner" label="Word between the names" show={joiner.show} hidden={joiner.hidden}>
              <span className="amp"><i aria-hidden="true" />{joiner.text}<i aria-hidden="true" /></span>
            </Editable>
            {joiner.show ? null : <span className="olv-sr"> &amp; </span>}
            <span className="hname">{couple.partnerTwoName}</span>
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
          {date || place ? (
            <Editable ctx={ctx} section={section} field="date" label="Date and place" show>
              {date ? <p className="hdate">{date}</p> : null}
              {place ? <p className="cap dim">{place}</p> : null}
            </Editable>
          ) : null}
          {rsvpLabel?.show && ctx.site.rsvp.enabled ? <SiteLink ctx={ctx} href="#rsvp" newTab={false} className="btn">{rsvpLabel.text}</SiteLink> : null}
          {photo && img.alt ? <span className="olv-sr">{img.alt}</span> : null}
        </div>
      </div>
      {isEdit(ctx) ? (
        <div className="hero-photo-edit">
          <Editable ctx={ctx} section={section} field="image" label="Photo inside the arch" show={!!photo} hidden={img.hidden} photo={false}>
            <span className="olv-edit-chip">📷 Change the photo inside the arch</span>
          </Editable>
        </div>
      ) : null}
      <span className="scroll-cue" aria-hidden="true"><i /></span>
    </section>
  );
}

function Countdown({ ctx, section, anchor }: P) {
  const c = section.content;
  const target = countdownTarget(ctx.site);
  const heading = el(section, "heading");
  if (!target && ctx.mode === "public") return null;
  const units: ["d" | "h" | "m" | "s", string, string][] = [["d", "daysUnit", "Days"], ["h", "hoursUnit", "Hours"], ["m", "minutesUnit", "Minutes"], ["s", "secondsUnit", "Seconds"]];
  return (
    <section id={anchor} className="strip-wrap" data-section="countdown" aria-label={heading.show ? heading.text! : "Countdown"}>
      <SectionEditChip ctx={ctx} section={section} name="Countdown" />
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
        <p className="cap strip-title">{heading.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="labels" label="Countdown wording" show>
        {target ? (
          <div className="strip" role="timer" aria-label="Time until the wedding">
            {units.map(([u, key, fallback]) => <div key={u}><b><CountdownValue target={target} unit={u} pad /></b><span className="cap">{labelOf(c, key, fallback)}</span></div>)}
          </div>
        ) : <p className="cap strip-title">Add your wedding date to start the countdown.</p>}
      </Editable>
    </section>
  );
}

/** The Celebration: Deco-cut cards, one per event, each with Add to calendar. */
function Events(p: P) {
  const { ctx, section } = p;
  const events = eventsFor(ctx.site);
  const l = eventLabels(section);
  return (
    <Frame {...p} name="Events">
      {events.length === 0 ? <NoEvents ctx={ctx} section={section} /> : (
        <div className={`cards${events.length === 1 ? " one" : events.length === 2 || events.length === 4 ? " two" : ""}`}>
          {events.map((e, i) => (
            <Editable key={`${e.name}-${i}`} ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show className="card-edit">
              <article className="card reveal">
                <EventCover ctx={ctx} e={e} className="card-cover" />
                <p className="cap gold-d">{dateOf(e.startsAtLocal, { weekday: "long", day: "numeric", month: "long" })}</p>
                <h3>{e.name}</h3>
                <p className="when"><time dateTime={e.startsAt}>{timeSpan(e)}</time></p>
                {e.venue ? <p>{e.venue.name}{e.venue.city ? <><br />{e.venue.city}</> : null}</p> : null}
                {e.description || e.notes ? <p className="desc">{[e.description, e.notes].filter(Boolean).join(" ")}</p> : null}
                {e.dressCode ? <p className="cap tiny">{l.dress} {e.dressCode}</p> : null}
                {l.showCal ? <CalButton ctx={ctx} e={e} label={l.cal} className="link" /> : null}
              </article>
            </Editable>
          ))}
        </div>
      )}
    </Frame>
  );
}

/** Our Story: alternating arched panels with outlined Roman numerals. */
function Story(p: P) {
  const { ctx, section, kit } = p;
  const chapters = chaptersOf(section);
  const body = el(section, "body");
  if (!body.show && chapters.length === 0 && !imageEl(section.content).ref && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Our story" intro={chapters.length ? "body" : null}>
      {chapters.length === 0 ? <StoryText {...p} /> : (
        <div className="zig">
          {chapters.map((ch, i) => (
            <Editable key={i} ctx={ctx} section={section} field={`chapters.${i}`} label={`Chapter ${ch.title}`} show>
              <article className={`row reveal${i % 2 ? " rev" : ""}`}>
                <div className="pic">
                  <Media src={ch.ref ? ctx.imageUrl({ ref: ch.ref }, "large") : null} alt={ch.alt} art={kit.art("story", i, `bt-st-${uid(section, i)}`, ctx)} />
                </div>
                <div className="txt">
                  <span className="num" aria-hidden="true">{roman(i + 1)}</span>
                  {ch.label ? <p className="cap gold">{ch.label}</p> : null}
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

const ICONS = [
  <svg key="g" viewBox="0 0 80 50" className="ico" aria-hidden="true"><path d="M6 8 L36 22 L36 28 L6 42 Z M74 8 L44 22 L44 28 L74 42 Z" /><rect x="34" y="18" width="12" height="14" rx="2" /></svg>,
  <svg key="l" viewBox="0 0 80 50" className="ico" aria-hidden="true"><path d="M30 4 h20 l-2 12 l14 30 h-44 l14 -30z" /><path d="M34 16 h12" /></svg>,
];

const kit: Kit = {
  design: "black-tie",
  root: "olv-bt",
  head: { wrapper: "head", eyebrow: "cap eb", ornament: <p className="dia" aria-hidden="true">◆ ◆ ◆</p>, intro: "sub" },
  tone: (key, position) => (key === "gallery" ? "film-sec" : DARK.has(key) ? "dark" : key === "events" || key === "faq" || key === "dress_code" ? "light" : position % 2 ? "dark" : "light"),
  art,
  gallery: "film",
  Hero,
  introMs: 3200,
  sections: {
    countdown: Countdown,
    events: Events,
    story: Story,
    dress_code: (p) => <InfoSection {...p} name="Dress code" variant="dress" icons={(i) => ICONS[i] ?? null} />,
    travel: (p) => <InfoSection {...p} name="Travel & stay" variant="trio" />,
    explore: (p) => <InfoSection {...p} name="Things to do" variant="trio" artFor="tile" />,
  },
  footerArt: () => <svg className="fan" viewBox="0 0 120 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: fan() }} />,
};

/** Black Tie: 1920s glamour in onyx and champagne gold. Gold rays fan out and the arch rises on opening. */
export const BlackTie = classicDesign(kit);
