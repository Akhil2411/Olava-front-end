import { bool, imageEl, label as labelOf } from "../../content";
import { Editable, SectionEditChip, SiteLink } from "../../Editable";
import type { RenderContext } from "../../types";
import { CountdownValue } from "../shared/Countdown";
import { countdownTarget, el, isEdit, names, uid, weddingDay } from "../shared/data";
import { Frame, InfoSection, Media, Programme, SectionPhoto, chaptersOf, classicDesign, type Kit, type P } from "../classic/Classic";
import { art, crest } from "./art";

const Rule = ({ mark = "❦" }: { mark?: string }) => <div className="rule" aria-hidden="true"><i /><b>{mark}</b><i /></div>;

/** The countdown line under the invitation card (when the site has a countdown section). */
function CardCountdown({ ctx }: { ctx: RenderContext }) {
  const section = ctx.site.sections.find((s) => s.key === "countdown");
  const target = countdownTarget(ctx.site);
  if (!section || (!target && ctx.mode === "public")) return null;
  const c = section.content;
  const heading = el(section, "heading");
  const units = [["d", "daysUnit", "Days"], ["h", "hoursUnit", "Hours"], ["m", "minutesUnit", "Minutes"], ["s", "secondsUnit", "Seconds"]] as const;
  return (
    <div id="countdown" data-section="countdown" className="cd-wrap">
      <SectionEditChip ctx={ctx} section={section} name="Countdown" />
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
        <p className="sc small cd-title">{heading.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="labels" label="Countdown wording" show>
        {target ? (
          <p className="countdown sc" role="timer" aria-label="Time until the wedding">
            {units.map(([u, key, fb]) => <span key={u}><b><CountdownValue target={target} unit={u} pad /></b> {labelOf(c, key, fb).toLowerCase()}</span>)}
          </p>
        ) : <p className="countdown sc">add your wedding date to start the countdown</p>}
      </Editable>
    </div>
  );
}

/** The engraved invitation card: a gold frame draws itself around it during the opening. */
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
      <Editable ctx={ctx} section={section} field={detKey} label={`${who}'s second line`} show={det.show} hidden={det.hidden}><p className="sc small">{det.text}</p></Editable>
    </div>
  );
  return (
    <section className="hero" id="home" aria-label={names(ctx.site)}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <div className="card">
        <div className="frame" aria-hidden="true"><i className="ft" /><i className="fr" /><i className="fb" /><i className="fl" /></div>
        <span className="corner c1" aria-hidden="true" /><span className="corner c2" aria-hidden="true" />
        <span className="corner c3" aria-hidden="true" /><span className="corner c4" aria-hidden="true" />
        <div className="card-in">
          <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!photo} hidden={img.hidden}>
            <div className="oval hero-oval">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo ?? undefined} alt={img.alt ?? ""} />
            </div>
          </Editable>
          <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
            <p className="sc small">{eyebrow.text}</p>
          </Editable>
          <h1 className="names" tabIndex={-1}>
            <span>{couple.partnerOneName}</span>
            <Editable ctx={ctx} section={section} field="joiner" label="Word between the names" show={joiner.show} hidden={joiner.hidden}>
              <span className="and">{joiner.text}</span>
            </Editable>
            {joiner.show ? null : <span className="olv-sr"> &amp; </span>}
            <span>{couple.partnerTwoName}</span>
          </h1>
          {families ? (
            <div className="families">
              {family(couple.partnerOneName, lines[0], lines[1], "partnerOneFamily", "partnerOneDetails")}
              {family(couple.partnerTwoName, lines[2], lines[3], "partnerTwoFamily", "partnerTwoDetails")}
            </div>
          ) : null}
          <Editable ctx={ctx} section={section} field="tagline" label="Invitation line" show={tagline.show} hidden={tagline.hidden}>
            <p className="sc request">{tagline.text}</p>
          </Editable>
          {day || place ? (
            <Editable ctx={ctx} section={section} field="date" label="Date and place" show>
              {day ? <p className="date">{day.weekday}, {day.long}</p> : null}
              {day?.time ? <p className="sc small">{day.time}</p> : null}
              {place ? <p className="sc place">{place}</p> : null}
            </Editable>
          ) : null}
          <Rule mark="✦" />
          {rsvpLabel?.show && ctx.site.rsvp.enabled ? <SiteLink ctx={ctx} href="#rsvp" newTab={false} className="btn">{rsvpLabel.text}</SiteLink> : null}
        </div>
      </div>
      <CardCountdown ctx={ctx} />
    </section>
  );
}

/** Our story: justified prose with a drop capital, and the chapters as oval vignettes. */
function Story(p: P) {
  const { ctx, section, kit } = p;
  const chapters = chaptersOf(section);
  const body = el(section, "body");
  if (!body.show && chapters.length === 0 && !imageEl(section.content).ref && ctx.mode === "public") return null;
  const paras = (body.text ?? "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  return (
    <Frame {...p} name="Our story" intro={null}>
      <SectionPhoto ctx={ctx} section={section} />
      <Editable ctx={ctx} section={section} field="body" label="Story text" show={body.show} hidden={body.hidden}>
        <div className="prose reveal">{paras.map((t, i) => <p key={i} className={i === 0 && (body.text?.length ?? 0) > 160 ? "drop" : undefined}>{t}</p>)}</div>
      </Editable>
      {chapters.length ? (
        <div className={`vignettes${chapters.length === 1 ? " one" : chapters.length === 2 ? " two-up" : ""}`}>
          {chapters.map((ch, i) => (
            <Editable key={i} ctx={ctx} section={section} field={`chapters.${i}`} label={`Chapter ${ch.title}`} show>
              <figure className="reveal">
                <div className="oval"><Media src={ch.ref ? ctx.imageUrl({ ref: ch.ref }, "large") : null} alt={ch.alt} art={kit.art("story", i, `il-st-${uid(section, i)}`, ctx)} /></div>
                <figcaption>{ch.label ? <span className="sc">{ch.label}</span> : null}{ch.title}</figcaption>
                {ch.text ? <p className="vig-text">{ch.text}</p> : null}
              </figure>
            </Editable>
          ))}
        </div>
      ) : isEdit(ctx) ? <Editable ctx={ctx} section={section} field="chapters" label="Chapters" show={false} /> : null}
    </Frame>
  );
}

const kit: Kit = {
  design: "ivory-letterpress",
  root: "olv-il",
  head: { wrapper: "sec-head", eyebrow: "sc small", ornament: <Rule />, intro: "lede" },
  tone: (_key, position) => (position % 2 ? "sec-paper" : ""),
  art,
  gallery: "grid",
  Hero,
  introMs: 3400,
  sections: {
    countdown: () => null, // under the invitation card
    story: Story,
    events: (p) => <Programme {...p} />,
    travel: (p) => <InfoSection {...p} name="Travel & stay" variant="two" />,
    explore: (p) => <InfoSection {...p} name="Things to do" variant="two" artFor="tile" />,
    dress_code: (p) => <InfoSection {...p} name="Dress code" variant="two" />,
    thank_you: (p) => <InfoSection {...p} name="Thank you" variant="two" />,
  },
  footerArt: (ctx) => <svg className="crest big" viewBox="0 0 60 60" aria-hidden="true" dangerouslySetInnerHTML={{ __html: crest(ctx) }} />,
};

/** Ivory Letterpress: an engraved paper invitation in ivory, black ink and gold foil. */
export const IvoryLetterpress = classicDesign(kit);
