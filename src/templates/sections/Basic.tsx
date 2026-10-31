import { eventsFor } from "../designs/shared/data";
import { VideoBlockView, videoOf } from "../designs/shared/VideoBlockView";
import type { SiteSection } from "@/lib/api/types";
import { formatDate, formatLocalDateTime } from "@/lib/utils/format";
import { footerBadge, imageEl, label, list, rsvpLabels, safeHref, textEl } from "../content";
import { RsvpBlock } from "../rsvp/RsvpBlock";
import { Editable, SectionEditChip, SiteLink } from "../Editable";
import type { RenderContext } from "../types";
import { CountdownGate, CountdownNumber } from "./Countdown";
import { SectionShell } from "./SectionShell";

type Props = { ctx: RenderContext; section: SiteSection; anchor: string };
const isEdit = (ctx: RenderContext) => ctx.mode === "edit";
const placeholders = (ctx: RenderContext) => ctx.mode !== "public";

// ───────────── Countdown ─────────────

export function Countdown({ ctx, section }: Props) {
  const c = section.content;
  const heading = textEl(c, "heading");
  const showHeading = !heading.hidden && !!heading.text;
  return (
    <CountdownGate weddingDate={ctx.site.couple.weddingDate} always={isEdit(ctx)}>
      <section aria-label="Countdown" className="px-5 py-10 text-center">
        <SectionEditChip ctx={ctx} section={section} name="Countdown" />
        <Editable ctx={ctx} section={section} field="heading" label="Heading" show={showHeading} hidden={heading.hidden}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--s-accent)]">{heading.text}</p>
        </Editable>
        <Editable ctx={ctx} section={section} field="labels" label="Countdown wording" show>
          <CountdownNumber weddingDate={ctx.site.couple.weddingDate} preview={isEdit(ctx)}
            daysLabel={label(c, "daysLabel", "days to go")} dayLabel={label(c, "dayLabel", "day to go")} todayText={label(c, "todayText", "Today!")} />
        </Editable>
      </section>
    </CountdownGate>
  );
}

// ───────────── Story & text sections ─────────────

export function Story({ ctx, section, anchor }: Props) {
  const body = textEl(section.content, "body");
  const img = imageEl(section.content);
  const image = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  const showBody = !body.hidden && !!body.text;
  if (!showBody && !image && ctx.mode === "public") return null;
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="Our story" intro={false}>
      <div className={image || isEdit(ctx) ? "grid items-center gap-8 sm:grid-cols-2" : ""}>
        <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!image} hidden={img.hidden}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image ?? undefined} alt={img.alt ?? ""} className="w-full rounded-2xl object-cover" />
        </Editable>
        <Editable ctx={ctx} section={section} field="body" label="Story text" show={showBody || ctx.mode === "preview"} hidden={body.hidden}>
          <p className="mx-auto max-w-2xl whitespace-pre-line text-center text-lg leading-relaxed sm:text-left">
            {body.text ?? (placeholders(ctx) ? "Tell your guests how you met…" : "")}
          </p>
        </Editable>
      </div>
    </SectionShell>
  );
}

export function TextSection({ ctx, section, anchor, name }: Props & { name: string }) {
  const body = textEl(section.content, "body");
  const img = imageEl(section.content);
  const image = img.ref && !img.hidden ? ctx.imageUrl({ ref: img.ref }, "large") : null;
  const links = list<{ label?: string; url?: string; description?: string }>(section.content, "links");
  const showBody = !body.hidden && !!body.text;
  if (!showBody && !image && links.length === 0 && ctx.mode === "public") return null;
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name={name} tone="surface" intro={false}>
      <Editable ctx={ctx} section={section} field="image" label="Photo" show={!!image} hidden={img.hidden} className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image ?? undefined} alt={img.alt ?? ""} className="mx-auto mb-8 max-h-96 w-full max-w-2xl rounded-2xl object-cover" />
      </Editable>
      <Editable ctx={ctx} section={section} field="body" label="Text" show={showBody || ctx.mode === "preview"} hidden={body.hidden}>
        <p className="mx-auto max-w-2xl whitespace-pre-line text-center leading-relaxed">{body.text ?? (placeholders(ctx) ? "Add details in the editor." : "")}</p>
      </Editable>
      {links.length > 0 || isEdit(ctx) ? (
        <Editable ctx={ctx} section={section} field="links" label="Buttons" show={links.length > 0} className="mt-8">
          <LinkButtons ctx={ctx} links={links} />
        </Editable>
      ) : null}
    </SectionShell>
  );
}

function LinkButtons({ ctx, links }: { ctx: RenderContext; links: { label?: string; url?: string; description?: string }[] }) {
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {links.map((l, i) => (
        <SiteLink key={i} ctx={ctx} href={safeHref(l.url)}
          className="rounded-full border-[1.5px] border-[var(--s-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--s-accent)] hover:bg-[var(--s-accent)] hover:text-[var(--s-bg)]">
          {l.label}
        </SiteLink>
      ))}
    </div>
  );
}

// ───────────── Events ─────────────

export function Events({ ctx, section, anchor }: Props) {
  const c = section.content;
  const timeline = section.layoutVariant === "event-timeline" || section.layoutVariant === "timeline";
  const events = eventsFor(ctx.site);
  const directions = label(c, "directionsLabel", "Get directions");
  const dressCode = label(c, "dressCodeLabel", "Dress code:");

  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="Events" tone="surface">
      {events.length === 0 ? (
        <Editable ctx={ctx} section={section} field="labels" label="Events wording" show>
          <p className="text-center text-[var(--s-muted)]">{label(c, "emptyText", "Event details are coming soon.")}</p>
        </Editable>
      ) : (
        <ol className={timeline ? "relative space-y-8 border-l border-[var(--s-accent)]/40 pl-6" : "grid gap-5 sm:grid-cols-2"}>
          {events.map((event, i) => {
            const start = formatLocalDateTime(event.startsAtLocal);
            const end = event.endsAtLocal ? formatLocalDateTime(event.endsAtLocal) : null;
            const cover = event.cover ? ctx.imageUrl(event.cover, "large") : null;
            return (
              <li key={`${event.name}-${i}`} className="overflow-hidden rounded-2xl border border-[var(--s-accent)]/30 bg-[var(--s-bg)]">
                <Editable ctx={ctx} section={section} field={`events.${i}`} label={`Event ${event.name}`} show>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-40 w-full object-cover" />
                  ) : null}
                  <div className="p-5 sm:p-6">
                    {event.eventType ? <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--s-accent)]">{event.eventType}</p> : null}
                    <h3 className="mt-1 font-[family-name:var(--s-heading)] text-3xl">{event.name}</h3>
                    <p className="mt-3 text-sm font-semibold">
                      <time dateTime={event.startsAt}>{start.date} · {start.time}</time>
                      {end ? <> – {end.date === start.date ? end.time : `${end.date} · ${end.time}`}</> : null}
                    </p>
                    {event.venue ? (
                      <div className="mt-3 text-sm">
                        <p className="font-medium">{event.venue.name}</p>
                        <p className="text-[var(--s-muted)]">
                          {[event.venue.addressLine, event.venue.city, event.venue.state, event.venue.postalCode].filter(Boolean).join(", ")}
                        </p>
                        {event.venue.mapUrl ? (
                          <SiteLink ctx={ctx} href={safeHref(event.venue.mapUrl)} newTab
                            className="mt-2 inline-flex items-center gap-1 font-semibold text-[var(--s-accent)] underline-offset-4 hover:underline">
                            <span aria-hidden="true">📍</span> {directions}<span className="sr-only"> to {event.venue.name}</span>
                          </SiteLink>
                        ) : null}
                      </div>
                    ) : null}
                    {event.dressCode ? <p className="mt-3 text-sm"><span className="font-semibold">{dressCode}</span> {event.dressCode}</p> : null}
                    {event.description ? <p className="mt-3 whitespace-pre-line text-sm text-[var(--s-muted)]">{event.description}</p> : null}
                    {event.notes ? <p className="mt-2 whitespace-pre-line text-sm italic text-[var(--s-muted)]">{event.notes}</p> : null}
                  </div>
                </Editable>
              </li>
            );
          })}
        </ol>
      )}
    </SectionShell>
  );
}

// ───────────── Gallery ─────────────

export function Gallery({ ctx, section, anchor }: Props) {
  const photos = ctx.site.gallery;
  if (photos.length === 0 && ctx.mode === "public") return null;
  const carousel = section.layoutVariant === "photo-carousel" || section.layoutVariant === "carousel";
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="Gallery">
      {photos.length === 0 ? (
        <Editable ctx={ctx} section={section} field="photos" label="Photos" show>
          <p className="rounded-2xl border border-dashed border-[var(--s-accent)]/40 p-10 text-center text-sm text-[var(--s-muted)]">Your photos will appear here.</p>
        </Editable>
      ) : (
        <Editable ctx={ctx} section={section} field="photos" label="Photos" show>
          <ul className={carousel ? "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4" : "grid grid-cols-2 gap-3 sm:grid-cols-3"}>
            {photos.map((image, i) => {
              const thumb = ctx.imageUrl(image, "thumb");
              const large = ctx.imageUrl(image, "large");
              return (
                <li key={image.ref} className={carousel ? "w-72 shrink-0 snap-center" : ""}>
                  <figure>
                    <SiteLink ctx={ctx} href={ctx.mode === "public" ? large : null} newTab={false} className="block overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb ?? undefined} alt={image.caption ?? `Photo ${i + 1}`} loading="lazy"
                        width={image.width ?? undefined} height={image.height ?? undefined}
                        className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105" />
                    </SiteLink>
                    {image.caption ? <figcaption className="mt-1.5 text-center text-xs text-[var(--s-muted)]">{image.caption}</figcaption> : null}
                  </figure>
                </li>
              );
            })}
          </ul>
        </Editable>
      )}
    </SectionShell>
  );
}

// ───────────── RSVP ─────────────

export function Rsvp({ ctx, section, anchor }: Props) {
  const rsvp = ctx.site.rsvp;
  const labels = rsvpLabels(section.content);
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="RSVP" tone="surface">
      <div className="mx-auto max-w-md">
        {rsvp.deadline ? (
          <Editable ctx={ctx} section={section} field="labels.deadline" label="Reply-by wording" show>
            <p className="mb-6 text-center text-sm">{labels.deadline} <strong>{formatDate(rsvp.deadline)}</strong>.</p>
          </Editable>
        ) : null}
        {!rsvp.isOpen && ctx.mode !== "edit" ? (
          <p className="rounded-2xl border border-[var(--s-accent)]/30 p-6 text-center">{labels.closed}</p>
        ) : (
          <Editable ctx={ctx} section={section} field="labels" label="RSVP form" show>
            <RsvpBlock ctx={ctx} labels={labels} />
          </Editable>
        )}
      </div>
    </SectionShell>
  );
}

// ───────────── FAQ ─────────────

export function Faq({ ctx, section, anchor }: Props) {
  const items = list<{ question?: string; answer?: string }>(section.content, "items").filter((i) => i.question && i.answer);
  if (items.length === 0 && ctx.mode === "public") return null;
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="FAQ">
      <Editable ctx={ctx} section={section} field="items" label="Questions" show>
        {items.length === 0 ? (
          <p className="text-center text-sm text-[var(--s-muted)]">Add questions and answers in the editor.</p>
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {items.map((item, i) => (
              <details key={i} className="rounded-2xl border border-[var(--s-accent)]/30 bg-[var(--s-surface)] px-5 py-4" open={isEdit(ctx) || undefined}>
                <summary className="cursor-pointer font-semibold">{item.question}</summary>
                <p className="mt-2 whitespace-pre-line text-sm text-[var(--s-muted)]">{item.answer}</p>
              </details>
            ))}
          </div>
        )}
      </Editable>
    </SectionShell>
  );
}

// ───────────── Contact ─────────────

export function Contact({ ctx, section, anchor }: Props) {
  const contact = ctx.site.contact;
  const note = textEl(section.content, "note");
  const showNote = !note.hidden && !!note.text;
  const email = contact?.email ?? null;
  const phone = contact?.phone ?? null;
  if (!showNote && !email && !phone && ctx.mode === "public") return null;
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="Contact" intro={false}>
      <div className="mx-auto max-w-md space-y-2 text-center">
        <Editable ctx={ctx} section={section} field="note" label="Note" show={showNote} hidden={note.hidden}>
          <p className="whitespace-pre-line text-[var(--s-muted)]">{note.text}</p>
        </Editable>
        {email || phone || isEdit(ctx) ? (
          <Editable ctx={ctx} section={section} field="details" label="Contact details" show={!!(email || phone)}>
            {email ? <p><SiteLink ctx={ctx} href={`mailto:${email}`} newTab={false} className="font-semibold text-[var(--s-accent)] underline-offset-4 hover:underline">{email}</SiteLink></p> : null}
            {phone ? <p><SiteLink ctx={ctx} href={`tel:${phone.replace(/[^+\d]/g, "")}`} newTab={false} className="font-semibold text-[var(--s-accent)] underline-offset-4 hover:underline">{phone}</SiteLink></p> : null}
          </Editable>
        ) : null}
      </div>
    </SectionShell>
  );
}

// ───────────── Wedding party ─────────────

export function WeddingParty({ ctx, section, anchor }: Props) {
  const members = list<{ name?: string; role?: string; bio?: string; ref?: string }>(section.content, "members").filter((m) => m.name);
  if (members.length === 0 && ctx.mode === "public") return null;
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="Wedding party">
      {members.length === 0 ? (
        <Editable ctx={ctx} section={section} field="members" label="People" show>
          <p className="text-center text-sm text-[var(--s-muted)]">Add the people standing with you.</p>
        </Editable>
      ) : (
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {members.map((m, i) => {
            const photo = m.ref ? ctx.imageUrl({ ref: m.ref }, "thumb") : null;
            return (
              <li key={i} className="text-center">
                <Editable ctx={ctx} section={section} field={`members.${i}`} label={`Person ${m.name}`} show>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="mx-auto mb-3 h-28 w-28 rounded-full border-2 border-[var(--s-accent)] object-cover" />
                  ) : (
                    <span aria-hidden="true" className="mx-auto mb-3 grid h-28 w-28 place-items-center rounded-full border-2 border-[var(--s-accent)] font-[family-name:var(--s-heading)] text-4xl text-[var(--s-accent)]">
                      {m.name!.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <p className="font-[family-name:var(--s-heading)] text-2xl">{m.name}</p>
                  {m.role ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--s-accent)]">{m.role}</p> : null}
                  {m.bio ? <p className="mt-2 whitespace-pre-line text-sm text-[var(--s-muted)]">{m.bio}</p> : null}
                </Editable>
              </li>
            );
          })}
        </ul>
      )}
    </SectionShell>
  );
}

// ───────────── Gift registry ─────────────

export function Registry({ ctx, section, anchor }: Props) {
  const links = list<{ label?: string; url?: string; description?: string }>(section.content, "links").filter((l) => l.label && safeHref(l.url));
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="Gift registry" tone="surface">
      {links.length === 0 ? (
        isEdit(ctx) ? (
          <Editable ctx={ctx} section={section} field="links" label="Registry links" show={false} />
        ) : null
      ) : (
        <Editable ctx={ctx} section={section} field="links" label="Registry links" show>
          <ul className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
            {links.map((l, i) => (
              <li key={i} className="rounded-2xl border border-[var(--s-accent)]/30 bg-[var(--s-bg)] p-5 text-center">
                <p className="font-[family-name:var(--s-heading)] text-2xl">{l.label}</p>
                {l.description ? <p className="mt-1 text-sm text-[var(--s-muted)]">{l.description}</p> : null}
                <SiteLink ctx={ctx} href={safeHref(l.url)}
                  className="mt-4 inline-block rounded-full bg-[var(--s-accent)] px-5 py-2 text-sm font-semibold text-[var(--s-bg)]">
                  View <span className="sr-only">{l.label}</span>
                </SiteLink>
              </li>
            ))}
          </ul>
        </Editable>
      )}
    </SectionShell>
  );
}

// ───────────── Footer ─────────────

export function Footer({ ctx, section }: { ctx: RenderContext; section: SiteSection | null }) {
  const c = section?.content ?? {};
  const line = textEl(c, "line");
  const { couple } = ctx.site;
  const text = line.text ?? `${couple.partnerOneName} & ${couple.partnerTwoName}`;
  const badge = footerBadge(c);
  const note = <p className="mt-6 text-xs text-[var(--s-muted)]">{badge.text}</p>;
  const body = !line.hidden ? <p className="font-[family-name:var(--s-heading)] text-2xl italic text-[var(--s-accent)]">{text}</p> : null;
  return (
    <footer className="px-5 pb-12 pt-6 text-center">
      {ctx.shareSlot ? <div className="mb-8">{ctx.shareSlot}</div> : null}
      {section ? (
        <>
          <Editable ctx={ctx} section={section} field="line" label="Closing line" show={!line.hidden} hidden={line.hidden}>
            {body}
          </Editable>
          <Editable ctx={ctx} section={section} field="badge" label="Footer note" show={!badge.hidden && !!badge.text} hidden={badge.hidden}>
            {note}
          </Editable>
        </>
      ) : <>{body}{!badge.hidden && badge.text ? note : null}</>}
    </footer>
  );
}

// ───────────── Video ─────────────

/** The uploaded video with its title and (optional) description; a play-mark stand-in until it's uploaded (editor/preview). */
export function VideoSection({ ctx, section, anchor }: Props) {
  const v = videoOf(section);
  if (!v.src && ctx.mode === "public") return null;
  const body = textEl(section.content, "body");
  const title = textEl(section.content, "heading").text ?? "Video";
  return (
    <SectionShell ctx={ctx} section={section} anchor={anchor} name="Video" intro={false}>
      <Editable ctx={ctx} section={section} field="body" label="Description" show={!body.hidden && !!body.text} hidden={body.hidden}>
        <p className="olv-video-desc text-[var(--s-muted)]">{body.text}</p>
      </Editable>
      <Editable ctx={ctx} section={section} field="video" label="Video" show>
        <VideoBlockView ctx={ctx} video={v} title={title} />
      </Editable>
    </SectionShell>
  );
}
