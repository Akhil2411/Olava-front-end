import type { ReactNode } from "react";
import { bool, imageEl, label as labelOf, list, safeHref } from "../../content";
import { Editable, SectionEditChip, SiteLink } from "../../Editable";
import type { RenderContext } from "../../types";
import { CountdownValue } from "../shared/Countdown";
import { countdownTarget, el, isEdit, names, uid, weddingDay } from "../shared/data";
import {
  Frame, InfoSection, Media, Programme, SectionPhoto, chaptersOf, classicDesign, placeOf, romanDate, type FrameProps, type Kit, type P,
} from "../classic/Classic";
import { IntroOverlay } from "../classic/Entrance";
import { art, crest } from "./art";

/** Every section is a chapter: its numeral, title and small label at the side, its contents beside them. */
function Chapter({ ctx, section, anchor, index, name, intro = "intro", className, children }: FrameProps) {
  const eyebrow = el(section, "eyebrow");
  const heading = el(section, "heading");
  const introEl = intro ? el(section, intro) : null;
  const cls = ["chapter", index % 2 ? "alt" : "", className].filter(Boolean).join(" ");
  return (
    <section id={anchor} className={cls} aria-labelledby={heading.show ? `${anchor}-title` : undefined} data-section={section.key}>
      <SectionEditChip ctx={ctx} section={section} name={name} />
      <div className="ch-side reveal">
        <p className="num" aria-hidden="true" />
        <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
          <h2 id={`${anchor}-title`}>{heading.text}</h2>
        </Editable>
        <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
          <p className="sc meta">{eyebrow.text}</p>
        </Editable>
      </div>
      <div className="ch-body reveal">
        {introEl ? (
          <Editable ctx={ctx} section={section} field={intro!} label="Introduction" show={introEl.show} hidden={introEl.hidden}>
            <p className="text lead">{introEl.text}</p>
          </Editable>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/** Commencing in 00 days, 00 hours (when the site has a countdown section). */
function TitleCountdown({ ctx }: { ctx: RenderContext }) {
  const section = ctx.site.sections.find((s) => s.key === "countdown");
  const target = countdownTarget(ctx.site);
  if (!section || (!target && ctx.mode === "public")) return null;
  const c = section.content;
  const heading = el(section, "heading");
  return (
    <div id="countdown" data-section="countdown" className="cd-wrap">
      <SectionEditChip ctx={ctx} section={section} name="Countdown" />
      <Editable ctx={ctx} section={section} field="labels" label="Countdown wording" show>
        <p className="sc cd" role="timer" aria-label="Time until the wedding">
          {heading.show ? <>{heading.text}: </> : null}
          {target ? <><b><CountdownValue target={target} unit="d" pad /></b> {labelOf(c, "daysUnit", "Days").toLowerCase()}, <b><CountdownValue target={target} unit="h" pad /></b> {labelOf(c, "hoursUnit", "Hours").toLowerCase()}</> : "add your wedding date"}
        </p>
      </Editable>
    </div>
  );
}

/** The opening spread: the title page (crest, names, date) and, facing it, the invitation and a plate. */
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
  const place = !bool(c, "hideVenue") ? placeOf(ctx) : null;
  const rsvpLabel = rsvp ? el(rsvp, "eyebrow") : null;
  const families = lines.some((l) => l.show) || isEdit(ctx);
  const family = (who: string, fam: typeof lines[0], det: typeof lines[0], famKey: string, detKey: string) => (
    <p>
      <span className="sc">{who}</span>
      <Editable ctx={ctx} section={section} field={famKey} label={`${who}'s family line`} show={fam.show} hidden={fam.hidden} inline>{fam.text}</Editable>
      {fam.show && det.show ? <br /> : null}
      <Editable ctx={ctx} section={section} field={detKey} label={`${who}'s second line`} show={det.show} hidden={det.hidden} inline><i>{det.text}</i></Editable>
    </p>
  );
  return (
    <section className="spread-wrap" id="home" aria-label={names(ctx.site)}>
      <SectionEditChip ctx={ctx} section={section} name="Welcome" />
      <div className="book">
        <div className="page title-page">
          <svg className="crest" viewBox="0 0 200 200" aria-hidden="true" dangerouslySetInnerHTML={{ __html: crest(ctx) }} />
          <h1 tabIndex={-1}>
            {couple.partnerOneName}
            <Editable ctx={ctx} section={section} field="joiner" label="Word between the names" show={joiner.show} hidden={joiner.hidden}>
              <i>{joiner.text}</i>
            </Editable>
            {joiner.show ? null : <span className="olv-sr"> &amp; </span>}
            {couple.partnerTwoName}
          </h1>
          <Editable ctx={ctx} section={section} field="tagline" label="Invitation line" show={tagline.show} hidden={tagline.hidden}>
            <p className="sub">{tagline.text}</p>
          </Editable>
          {day || place ? (
            <Editable ctx={ctx} section={section} field="date" label="Date and place" show>
              <p className="sc date">{[day ? `${day.weekday}, ${day.long}` : null, place].filter(Boolean).join(" · ")}</p>
            </Editable>
          ) : null}
          <TitleCountdown ctx={ctx} />
          {rsvpLabel?.show && ctx.site.rsvp.enabled ? <SiteLink ctx={ctx} href="#rsvp" newTab={false} className="btn">{rsvpLabel.text}</SiteLink> : null}
        </div>
        <div className="page facing">
          <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
            <p className="sc facing-label">{eyebrow.text}</p>
          </Editable>
          <p className="orn" aria-hidden="true">❧</p>
          <Editable ctx={ctx} section={section} field="image" label="Photo" show hidden={img.hidden}>
            <figure className="plate"><Media src={photo} alt={img.alt} art={art("plate", 0, "hl-hero-plate", ctx)} /></figure>
          </Editable>
          {families ? (
            <div className="notes families">
              {family(couple.partnerOneName, lines[0], lines[1], "partnerOneFamily", "partnerOneDetails")}
              {family(couple.partnerTwoName, lines[2], lines[3], "partnerTwoFamily", "partnerTwoDetails")}
            </div>
          ) : null}
          {romanDate(ctx.site) && day ? <p className="sc year" aria-hidden="true">{romanDate(ctx.site)}</p> : null}
        </div>
      </div>
    </section>
  );
}

/** A chapter's prose: two columns with a drop capital. */
const Prose = ({ text }: { text: string }) => {
  const paras = text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  return <div className={`text${text.length > 420 ? " two-col" : ""}`}>{paras.map((t, i) => <p key={i} className={i === 0 && text.length > 160 ? "drop" : undefined}>{t}</p>)}</div>;
};

function Story(p: P) {
  const { ctx, section, kit } = p;
  const chapters = chaptersOf(section);
  const body = el(section, "body");
  const img = imageEl(section.content);
  if (!body.show && chapters.length === 0 && !img.ref && ctx.mode === "public") return null;
  return (
    <Frame {...p} name="Our story" intro={null}>
      <Editable ctx={ctx} section={section} field="body" label="Story text" show={body.show} hidden={body.hidden}>
        <Prose text={body.text ?? ""} />
      </Editable>
      <SectionPhoto ctx={ctx} section={section} className="cl-photo plate-photo" />
      {chapters.map((ch, i) => (
        <Editable key={i} ctx={ctx} section={section} field={`chapters.${i}`} label={`Chapter ${ch.title}`} show>
          <article className="leaf reveal">
            {ch.label ? <p className="sc meta">{ch.label}</p> : null}
            <h3>{ch.title}</h3>
            {ch.text ? <Prose text={ch.text} /> : null}
            <figure className="plate"><Media src={ch.ref ? ctx.imageUrl({ ref: ch.ref }, "large") : null} alt={ch.alt} art={kit.art("story", i, `hl-st-${uid(section, i)}`, ctx)} /></figure>
            {ch.ref && ch.alt ? <p className="caption">{ch.alt}</p> : null}
          </article>
        </Editable>
      ))}
      {chapters.length === 0 && isEdit(ctx) ? <Editable ctx={ctx} section={section} field="chapters" label="Chapters" show={false} /> : null}
    </Frame>
  );
}

/** The gift registry as the book's epilogue (outside the numbered chapters). */
function Registry({ ctx, section, anchor }: P) {
  const intro = el(section, "intro");
  const heading = el(section, "heading");
  const eyebrow = el(section, "eyebrow");
  const links = list<{ label?: string; url?: string; description?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  if (!intro.show && links.length === 0 && ctx.mode === "public") return null;
  return (
    <section id={anchor} className="epilogue" data-section="registry" aria-labelledby={heading.show ? `${anchor}-title` : undefined}>
      <SectionEditChip ctx={ctx} section={section} name="Gift registry" />
      <p className="orn reveal" aria-hidden="true">❧</p>
      <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={eyebrow.show} hidden={eyebrow.hidden}>
        <p className="sc meta reveal">{eyebrow.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="heading" label="Heading" show={heading.show} hidden={heading.hidden}>
        <h2 id={`${anchor}-title`} className="reveal">{heading.text}</h2>
      </Editable>
      <Editable ctx={ctx} section={section} field="intro" label="Introduction" show={intro.show} hidden={intro.hidden}>
        <p className="reveal text">{intro.text}</p>
      </Editable>
      {links.length || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="links" label="Registry links" show={links.length > 0}>
          <div className={`gifts reveal${links.length === 1 ? " one" : ""}`}>
            {links.map((l, i) => (
              <SiteLink key={i} ctx={ctx} href={safeHref(l.url)} className="gift">
                {l.description ? <span className="sc">{l.description}</span> : null}
                <b>{l.label}</b>
              </SiteLink>
            ))}
          </div>
        </Editable>
      ) : null}
    </section>
  );
}

function info(name: string, variant = "notes"): (p: P) => ReactNode {
  const Info = (p: P) => <InfoSection {...p} name={name} variant={variant} />;
  Info.displayName = `Info(${name})`;
  return Info;
}

const kit: Kit = {
  design: "heirloom",
  root: "olv-hl",
  head: {},
  Frame: Chapter,
  art,
  gallery: "grid",
  Hero,
  introMs: 3000,
  Overlay: ({ ctx }) => (
    <IntroOverlay className="crest-intro">
      <svg viewBox="0 0 200 200" aria-hidden="true" dangerouslySetInnerHTML={{ __html: crest(ctx, true) }} />
      <button type="button" className="skip sc" data-cl-skip="">Open the book</button>
    </IntroOverlay>
  ),
  sections: {
    countdown: () => null, // on the title page
    story: Story,
    events: (p) => <Programme {...p} />,
    registry: Registry,
    travel: info("Travel & stay"),
    explore: info("Things to do"),
    dress_code: info("Dress code"),
    thank_you: info("Thank you"),
  },
  footerArt: (ctx) => <svg className="crest sm" viewBox="0 0 200 200" aria-hidden="true" dangerouslySetInnerHTML={{ __html: crest(ctx) }} />,
};

/** Heirloom: a treasured storybook. A gold crest draws itself, then the book opens onto chapters in Roman numerals. */
export const Heirloom = classicDesign(kit);
