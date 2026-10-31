import type { SiteSection } from "@/lib/api/types";
import { bool, label as labelOf } from "../../content";
import { Editable, SiteLink } from "../../Editable";
import type { RenderContext } from "../../types";
import { AddToCalendar } from "./AddToCalendar";
import { calendarEvent, dateOf, eventsFor, fileSlug, isEdit, mapsUrl, timeOf } from "./data";
import type { EventLayout } from "./layouts";

/**
 * The shared event layouts (cards, timeline, agenda list) that every design can show, in the design's own
 * colours and fonts (shared.css). Shows each event's cover photo when it has one, the venue with directions,
 * dress code, notes and Add to calendar.
 */
export function EventList({ ctx, section, layout, className = "" }: { ctx: RenderContext; section: SiteSection; layout: EventLayout; className?: string }) {
  const c = section.content;
  const events = eventsFor(ctx.site);
  const showCal = bool(c, "showCalendar", true);
  const cal = labelOf(c, "calendarLabel", "Add to calendar");
  const dress = labelOf(c, "dressCodeLabel", "Dress code:");
  const directions = labelOf(c, "directionsLabel", "Get directions");
  const many = new Set(events.map((e) => e.startsAtLocal.slice(0, 10))).size > 1;
  return (
    <ol className={`olv-ev olv-ev-root ${className}`} data-layout={layout} data-count={events.length}>
      {events.map((e, i) => {
        const cover = e.cover ? ctx.imageUrl(e.cover, "large") : null;
        const end = e.endsAtLocal && e.endsAtLocal.slice(0, 10) === e.startsAtLocal.slice(0, 10) ? ` – ${timeOf(e.endsAtLocal)}` : "";
        const day = dateOf(e.startsAtLocal, { weekday: "short", day: "numeric", month: "short" });
        return (
          <li key={`${e.name}-${i}`} className="olv-ev olv-ev-item reveal">
            <Editable ctx={ctx} section={section} field={`events.${i}`} label={`Event ${e.name}`} show className="olv-ev olv-ev-edit">
              <article className="olv-ev olv-ev-card" data-cover={cover ? "" : undefined}>
                {layout === "event-agenda" ? (
                  <p className="olv-ev olv-ev-side"><time dateTime={e.startsAt}>{many ? <><span className="olv-ev olv-ev-day">{day}</span><br /></> : null}{timeOf(e.startsAtLocal)}</time></p>
                ) : null}
                {layout === "event-timeline" ? <span className="olv-ev olv-ev-dot" aria-hidden="true" /> : null}
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="olv-ev olv-ev-cover" src={cover} alt="" loading="lazy" />
                ) : null}
                <div className="olv-ev olv-ev-body">
                  {layout !== "event-agenda" ? <p className="olv-ev olv-ev-when"><time dateTime={e.startsAt}>{day} · {timeOf(e.startsAtLocal)}{end}</time></p> : null}
                  <h3 className="olv-ev olv-ev-name">{e.name}</h3>
                  {e.venue ? (
                    <p className="olv-ev olv-ev-place">
                      {[e.venue.name, e.venue.city].filter(Boolean).join(", ")}
                      {" "}<SiteLink ctx={ctx} href={mapsUrl(e.venue)} newTab className="olv-ev olv-ev-map">{directions}<span className="olv-sr"> to {e.venue.name}</span></SiteLink>
                    </p>
                  ) : null}
                  {e.description ? <p className="olv-ev olv-ev-text">{e.description}</p> : null}
                  {e.dressCode ? <p className="olv-ev olv-ev-note"><b>{dress}</b> {e.dressCode}</p> : null}
                  {e.notes ? <p className="olv-ev olv-ev-note">{e.notes}</p> : null}
                  {showCal ? (
                    <AddToCalendar events={[calendarEvent(ctx.site, e)]} fileName={`${fileSlug(ctx.site)}-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="olv-ev olv-ev-cal" disabled={isEdit(ctx)}>
                      + {cal}<span className="olv-sr">: {e.name}</span>
                    </AddToCalendar>
                  ) : null}
                </div>
              </article>
            </Editable>
          </li>
        );
      })}
    </ol>
  );
}

/** The shared FAQ layouts: every answer shown (two columns on wide screens), or cards. */
export function FaqList({ ctx, section, items, layout }: { ctx: RenderContext; section: SiteSection; items: { question?: string; answer?: string }[]; layout: "faq-open" | "faq-cards" }) {
  return (
    <Editable ctx={ctx} section={section} field="items" label="Questions" show={items.length > 0}>
      <dl className="olv-faq olv-faq-root reveal" data-layout={layout}>
        {items.map((it, i) => (
          <div key={i} className="olv-faq olv-faq-item">
            <dt className="olv-faq olv-faq-q">{it.question}</dt>
            <dd className="olv-faq olv-faq-a">{it.answer}</dd>
          </div>
        ))}
      </dl>
    </Editable>
  );
}
