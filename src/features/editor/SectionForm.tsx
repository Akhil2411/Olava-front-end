"use client";

import Link from "next/link";
import { SelectField, TextArea, TextField } from "@/components/ui";
import type { ContentBlock, LinkItem, Section } from "@/lib/api/types";
import { FOOTER_BADGE_DEFAULT, RSVP_LABEL_DEFAULTS, footerBadge } from "@/templates/content";
import { BlocksEditor } from "./BlocksEditor";
import { useEditor } from "./context";
import { FieldFrame, ImageField, LabelField, LinksField, ListField, TextElementField, Toggle, asImage } from "./fields";
import { GalleryPhotos } from "./GalleryPhotos";
import { VideoField } from "./VideoField";
import { eventLabelFields, layoutOptions, layoutValue } from "@/templates/designs/shared/layouts";
import { FaqPresetPicker } from "@/features/faq/FaqPresetPicker";
import { faqSample } from "@/features/faq/presets";

type Content = Record<string, unknown>;
type Chapter = { label: string | null; title: string; text: string | null; mediaId: string | null; alt: string | null };
type InfoItem = { label: string | null; title: string; text: string | null; url: string | null; linkLabel: string | null; mediaId: string | null; alt: string | null; colors?: string[] | null };
const HEX = /^#[0-9a-f]{6}$/i;
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);


/** All editable fields of one section. Every change goes straight into the draft (autosaved by the editor). */
export function SectionForm({ section, onContent, onLayout }: {
  section: Section;
  onContent: (content: Content) => void;
  onLayout: (variant: string) => void;
}) {
  const { weddingId, readOnly, partnerNames, design } = useEditor();
  const [one, two] = partnerNames ?? ["Partner one", "Partner two"];
  const c = section.content;
  const set = (key: string, value: unknown) => onContent({ ...c, [key]: value });
  const base = `/dashboard/weddings/${weddingId}`;

  const header = (opts: { eyebrow?: boolean; intro?: boolean; headingLabel?: string } = {}) => (
    <>
      {opts.eyebrow !== false ? <TextElementField field="eyebrow" label="Small label" value={c.eyebrow} maxLength={120} onChange={(v) => set("eyebrow", v)} /> : null}
      <TextElementField field="heading" label={opts.headingLabel ?? "Heading"} value={c.heading} maxLength={150} onChange={(v) => set("heading", v)} />
      {opts.intro ? <TextElementField field="intro" label="Introduction" value={c.intro} maxLength={1000} multiline rows={3} onChange={(v) => set("intro", v)} /> : null}
    </>
  );

  const layoutChoices = layoutOptions(section.type, section.layoutVariants, design ?? null);
  const layout = layoutChoices.length > 1 ? (
    <FieldFrame field="layout">
      <SelectField label="Layout" value={layoutValue(section, design ?? null, section.type)} disabled={readOnly} onChange={(e) => onLayout(e.target.value)}
        hint="Changes how this section is arranged on your website. Your content stays the same.">
        {layoutChoices.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </SelectField>
    </FieldFrame>
  ) : null;

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-6">
          <TextElementField field="eyebrow" label="Opening line" value={c.eyebrow} maxLength={120} onChange={(v) => set("eyebrow", v)} />
          <FieldFrame field="names">
            <p className="text-sm font-semibold">Names and date</p>
            <p className="text-sm text-mute">Your names and wedding date come from <Link className="font-semibold text-pink-dark underline" href={`${base}/details`}>Wedding details</Link>, so they stay the same everywhere.</p>
          </FieldFrame>
          <TextElementField field="partnerOneFamily" label={`${one}'s family line`} value={c.partnerOneFamily} maxLength={150}
            placeholder="Son of Mr. & Mrs. …" onChange={(v) => set("partnerOneFamily", v)} />
          <TextElementField field="partnerOneDetails" label={`${one}'s second line`} value={c.partnerOneDetails} maxLength={200} multiline rows={2}
            placeholder="B.E., M.S. · Data Scientist" hint="Qualifications or profession. Press Enter for a new line." onChange={(v) => set("partnerOneDetails", v)} />
          <TextElementField field="joiner" label="Word between the names" value={c.joiner} maxLength={20} onChange={(v) => set("joiner", v)} placeholder="&" />
          <TextElementField field="partnerTwoFamily" label={`${two}'s family line`} value={c.partnerTwoFamily} maxLength={150}
            placeholder="Daughter of Mr. & Mrs. …" onChange={(v) => set("partnerTwoFamily", v)} />
          <TextElementField field="partnerTwoDetails" label={`${two}'s second line`} value={c.partnerTwoDetails} maxLength={200} multiline rows={2}
            placeholder="MBBS, MD · Pediatrician" onChange={(v) => set("partnerTwoDetails", v)} />
          <TextElementField field="tagline" label="Invitation line" value={c.tagline} maxLength={200} onChange={(v) => set("tagline", v)} />
          <TextElementField field="openingNote" label="Note under “Tap to open”" value={c.openingNote} maxLength={80} placeholder="Our film begins with music"
            hint="Shown on opening screens that start your music (Cinematic designs), only while music is on." onChange={(v) => set("openingNote", v)} />
          <ImageField field="image" label="Photo" value={c.image} onChange={(v) => set("image", v)} />
          <Toggle field="date" label="Show the date" checked={c.hideDate !== true} onChange={(v) => set("hideDate", !v)} />
          <Toggle field="venue" label="Show the first venue" checked={c.hideVenue !== true} onChange={(v) => set("hideVenue", !v)} hint="Taken from your first event with a venue." />
        </div>
      );
    case "countdown":
      return (
        <div className="space-y-6">
          <TextElementField field="heading" label="Heading" value={c.heading} maxLength={120} onChange={(v) => set("heading", v)} />
          <FieldFrame field="labels" className="space-y-4">
            <LabelField field="labels.days" label="“Days to go” wording" value={c.daysLabel} fallback="days to go" onChange={(v) => set("daysLabel", v)} />
            <LabelField field="labels.day" label="“Day to go” wording (one day left)" value={c.dayLabel} fallback="day to go" onChange={(v) => set("dayLabel", v)} />
            <LabelField field="labels.today" label="On the day" value={c.todayText} fallback="Today!" onChange={(v) => set("todayText", v)} />
            <p className="pt-2 text-xs text-mute">Designs with a clock show these words under the numbers:</p>
            <div className="grid grid-cols-2 gap-3">
              <LabelField field="labels.daysUnit" label="Days" value={c.daysUnit} fallback="Days" maxLength={20} onChange={(v) => set("daysUnit", v)} />
              <LabelField field="labels.hoursUnit" label="Hours" value={c.hoursUnit} fallback="Hours" maxLength={20} onChange={(v) => set("hoursUnit", v)} />
              <LabelField field="labels.minutesUnit" label="Minutes" value={c.minutesUnit} fallback="Minutes" maxLength={20} onChange={(v) => set("minutesUnit", v)} />
              <LabelField field="labels.secondsUnit" label="Seconds" value={c.secondsUnit} fallback="Seconds" maxLength={20} onChange={(v) => set("secondsUnit", v)} />
            </div>
          </FieldFrame>
          <p className="text-xs text-mute">The countdown disappears after your wedding day.</p>
        </div>
      );
    case "story":
      return (
        <div className="space-y-6">
          {header()}
          <TextElementField field="body" label="Your story" value={c.body} maxLength={4000} multiline rows={7} onChange={(v) => set("body", v)} />
          <ImageField field="image" label="Photo" value={c.image} onChange={(v) => set("image", v)} />
          <ListField field="chapters" title="Chapters (optional)" items={arr<Chapter>(c.chapters)} max={12} addLabel="Add a chapter"
            onChange={(chapters) => set("chapters", chapters)} create={() => ({ label: null, title: "", text: null, mediaId: null, alt: null })}
            itemLabel={(ch, i) => ch.title || `Chapter ${i + 1}`}
            renderItem={(ch, update, i) => (
              <>
                <TextField label="When / where (optional)" value={ch.label ?? ""} maxLength={80} placeholder="2019 · London" onChange={(e) => update({ label: e.target.value || null })} />
                <TextField label="Title" value={ch.title} maxLength={150} required placeholder="A borrowed umbrella" onChange={(e) => update({ title: e.target.value })} />
                <TextArea label="Text (optional)" value={ch.text ?? ""} maxLength={2000} rows={3} onChange={(e) => update({ text: e.target.value || null })} />
                <ImageField field={`chapters.${i}.photo`} label="Photo" canHide={false} value={{ mediaId: ch.mediaId, alt: ch.alt, hidden: false }}
                  onChange={(img) => { const im = asImage(img); update({ mediaId: im.mediaId, alt: im.alt }); }} />
              </>
            )} />
          <p className="text-xs text-mute">Chapters show your milestones as a timeline, pages or a carousel, depending on the design.</p>
        </div>
      );
    case "events": {
      const eventFields = eventLabelFields(design ?? null, layoutValue(section, design ?? null, section.type));
      return (
        <div className="space-y-6">
          {header({ intro: true })}
          {layout}
          <FieldFrame field="events">
            <p className="text-sm text-mute">Events, times and venues are managed in <Link className="font-semibold text-pink-dark underline" href={`${base}/events`}>Events</Link>.</p>
          </FieldFrame>
          <details className="rounded-2xl border border-line p-4">
            <summary className="cursor-pointer text-sm font-semibold">Wording on the event cards</summary>
            <FieldFrame field="labels" className="mt-4 space-y-4">
              <Toggle field="labels.calendar" label="Show “Add to calendar” on each event" checked={c.showCalendar !== false} onChange={(v) => set("showCalendar", v)} />
              {c.showCalendar !== false ? (
                <LabelField field="labels.calendarLabel" label="“Add to calendar” button" value={c.calendarLabel} fallback="Add to calendar" maxLength={40} onChange={(v) => set("calendarLabel", v)} />
              ) : null}
              <LabelField field="labels.dresscode" label="Dress code label" hint="Shown before the dress code of events that have one."
                value={c.dressCodeLabel} fallback="Dress code:" onChange={(v) => set("dressCodeLabel", v)} />
              {eventFields.directions ? (
                <LabelField field="labels.directions" label="Directions link" hint="Shown under each event's venue. It opens the venue in Google Maps."
                  value={c.directionsLabel} fallback="Get directions" onChange={(v) => set("directionsLabel", v)} />
              ) : null}
              {eventFields.timePlace ? (
                <>
                  <LabelField field="labels.time" label="“Time” label" value={c.timeLabel} fallback="Time" maxLength={40} onChange={(v) => set("timeLabel", v)} />
                  <LabelField field="labels.place" label="“Place” label" value={c.placeLabel} fallback="Place" maxLength={40} onChange={(v) => set("placeLabel", v)} />
                </>
              ) : null}
              <LabelField field="labels.empty" label="Message before you add events" hint="Shown only while you have no events."
                value={c.emptyText} fallback="Event details are coming soon." maxLength={200} onChange={(v) => set("emptyText", v)} />
            </FieldFrame>
          </details>
        </div>
      );
    }
    case "gallery":
      return (
        <div className="space-y-6">
          {header({ intro: true })}
          {layout}
          <FieldFrame field="photos"><GalleryPhotos /></FieldFrame>
        </div>
      );
    case "rsvp": {
      const labels = (c.labels && typeof c.labels === "object" ? c.labels : {}) as Record<string, unknown>;
      const setLabel = (k: string, v: string) => set("labels", { ...labels, [k]: v });
      const labelNames: Record<keyof typeof RSVP_LABEL_DEFAULTS, string> = {
        name: "Name field", attend: "Question", accept: "Yes answer", decline: "No answer", undecided: "Maybe answer",
        guests: "Guests field", message: "Message field", submit: "Send button", thanks: "Thank-you message",
        closed: "When RSVPs are closed", deadline: "Reply-by wording", privacy: "Privacy note",
      };
      return (
        <div className="space-y-6">
          {header({ intro: true })}
          <FieldFrame field="settings" className="space-y-4">
            <TextField label="Reply by (optional)" type="date" value={typeof c.deadline === "string" ? c.deadline : ""} disabled={readOnly}
              onChange={(e) => set("deadline", e.target.value || null)} hint="RSVPs close after this date." />
            <Toggle field="settings.undecided" label="Allow “Not sure yet”" checked={c.allowUndecided !== false} onChange={(v) => set("allowUndecided", v)} />
            <SelectField label="Guests each person may bring" value={String(typeof c.maxPlusOnes === "number" ? c.maxPlusOnes : 1)} disabled={readOnly}
              onChange={(e) => set("maxPlusOnes", Number(e.target.value))}>
              {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i === 0 ? "None" : i}</option>)}
            </SelectField>
            <Toggle field="settings.message" label="Ask for a message" checked={c.collectMessage !== false} onChange={(v) => set("collectMessage", v)} />
          </FieldFrame>
          <details className="rounded-2xl border border-line p-4" open={undefined}>
            <summary className="cursor-pointer text-sm font-semibold">Form wording</summary>
            <FieldFrame field="labels" className="mt-4 space-y-4">
              {(Object.keys(RSVP_LABEL_DEFAULTS) as (keyof typeof RSVP_LABEL_DEFAULTS)[]).map((k) => (
                <LabelField key={k} field={`labels.${k}`} label={labelNames[k]} value={labels[k]} fallback={RSVP_LABEL_DEFAULTS[k]}
                  maxLength={k === "thanks" || k === "closed" ? 300 : k === "privacy" ? 200 : k === "attend" || k === "deadline" ? 80 : 60}
                  onChange={(v) => setLabel(k, v)} />
              ))}
            </FieldFrame>
          </details>
        </div>
      );
    }
    case "faq": {
      const faqItems = arr<{ question: string; answer: string }>(c.items);
      return (
        <div className="space-y-6">
          {header({ intro: true })}
          {layout}
          <FaqPresetPicker questions={faqItems.map((q) => q.question)} disabled={readOnly} full={faqItems.length >= 30}
            onAdd={(question) => set("items", [...faqItems, { question, answer: "" }])} />
          <ListField field="items" title="Questions" items={faqItems} max={30} addLabel="Add your own question"
            onChange={(items) => set("items", items)} create={() => ({ question: "", answer: "" })}
            itemLabel={(q, i) => q.question || `Question ${i + 1}`}
            renderItem={(q, update) => (
              <>
                <TextField label="Question" value={q.question} maxLength={200} required placeholder="e.g. Is there parking at the venue?" onChange={(e) => update({ question: e.target.value })} />
                <TextArea label="Answer" value={q.answer} maxLength={2000} rows={3} required placeholder={faqSample(q.question)} onChange={(e) => update({ answer: e.target.value })} />
              </>
            )} />
        </div>
      );
    }
    case "travel":
    case "dress_code":
    case "explore":
    case "thank_you": {
      const itemHints: Record<string, [string, string, string]> = {
        travel: ["Getting there", "Shuttle from the station", "Add a tip"],
        dress_code: ["Mehendi", "Garden greens", "Add an item"],
        explore: ["Day trip", "The old town", "Add a place"],
        thank_you: ["", "Our families", "Add an item"],
      };
      const [labelHint, titleHint, addLabel] = itemHints[section.type];
      return (
        <div className="space-y-6">
          {header()}
          <TextElementField field="body" label="Text" value={c.body} maxLength={4000} multiline rows={5} onChange={(v) => set("body", v)} />
          <ListField field="items" title="Items (optional)" items={arr<InfoItem>(c.items)} max={12} addLabel={addLabel}
            onChange={(items) => set("items", items)} create={() => ({ label: null, title: "", text: null, url: null, linkLabel: null, mediaId: null, alt: null })}
            itemLabel={(it, i) => it.title || `Item ${i + 1}`}
            renderItem={(it, update, i) => (
              <>
                <TextField label="Small label (optional)" value={it.label ?? ""} maxLength={80} placeholder={labelHint} onChange={(e) => update({ label: e.target.value || null })} />
                <TextField label="Title" value={it.title} maxLength={150} required placeholder={titleHint} onChange={(e) => update({ title: e.target.value })} />
                <TextArea label="Text (optional)" value={it.text ?? ""} maxLength={2000} rows={3} onChange={(e) => update({ text: e.target.value || null })} />
                <TextField label="Link (optional)" type="url" inputMode="url" value={it.url ?? ""} maxLength={2048} placeholder="https://" hint="Must start with https://"
                  onChange={(e) => update({ url: e.target.value.trim() || null })} />
                {it.url ? <TextField label="Link wording" value={it.linkLabel ?? ""} maxLength={40} placeholder="Find out more" onChange={(e) => update({ linkLabel: e.target.value || null })} /> : null}
                <ImageField field={`items.${i}.photo`} label="Photo" canHide={false} value={{ mediaId: it.mediaId, alt: it.alt, hidden: false }}
                  onChange={(img) => { const im = asImage(img); update({ mediaId: im.mediaId, alt: im.alt }); }} />
                {section.type === "dress_code" ? <Swatches colors={it.colors ?? []} onChange={(colors) => update({ colors: colors.length ? colors : null })} /> : null}
              </>
            )} />
          <ImageField field="image" label="Photo" value={c.image} onChange={(v) => set("image", v)} />
          <LinksField field="links" links={arr<LinkItem>(c.links)} max={5} onChange={(links) => set("links", links)} />
        </div>
      );
    }
    case "welcome":
      return (
        <div className="space-y-6">
          {header()}
          <TextElementField field="body" label="Your letter" value={c.body} maxLength={4000} multiline rows={6} onChange={(v) => set("body", v)} />
          <TextElementField field="signature" label="Signature" value={c.signature} maxLength={80} placeholder="With love," hint="Your names follow the signature." onChange={(v) => set("signature", v)} />
        </div>
      );
    case "save_the_date":
      return (
        <div className="space-y-6">
          {header()}
          <TextElementField field="note" label="Note on the card" value={c.note} maxLength={120} onChange={(v) => set("note", v)} />
          <FieldFrame field="names">
            <p className="text-sm text-mute">The date and time come from <Link className="font-semibold text-pink-dark underline" href={`${base}/details`}>Wedding details</Link> and your first event that day.</p>
          </FieldFrame>
          <Toggle field="scratch" label="Scratch to reveal (designs with a scratch card)" checked={c.scratch !== false} onChange={(v) => set("scratch", v)} />
          {c.scratch !== false ? <LabelField field="scratchHint" label="Scratch instruction" value={c.scratchHint} fallback="Scratch the heart to reveal the date" maxLength={120} onChange={(v) => set("scratchHint", v)} /> : null}
          <LabelField field="buttonLabel" label="Button wording" value={c.buttonLabel} fallback="Save the date" maxLength={40} onChange={(v) => set("buttonLabel", v)} />
        </div>
      );
    case "venue":
      return (
        <div className="space-y-6">
          {header({ intro: true })}
          <FieldFrame field="venues">
            <p className="text-sm text-mute">Shows each venue used by your <Link className="font-semibold text-pink-dark underline" href={`${base}/events`}>Events</Link>, with a link that opens it in the guest&apos;s maps app.</p>
          </FieldFrame>
          <FieldFrame field="labels" className="space-y-4">
            <LabelField field="directionsLabel" label="Map link wording" value={c.directionsLabel} fallback="Open in Maps" maxLength={40} onChange={(v) => set("directionsLabel", v)} />
            <LabelField field="labels.empty" label="When no event has a venue yet" value={c.emptyText} fallback="Add a venue to your events to show it here." maxLength={200} onChange={(v) => set("emptyText", v)} />
          </FieldFrame>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-6">
          {header()}
          <TextElementField field="note" label="Note" value={c.note} maxLength={500} multiline rows={3} onChange={(v) => set("note", v)} />
          <FieldFrame field="details" className="space-y-3">
            <Toggle field="details.email" label="Show our email" checked={c.showEmail === true} onChange={(v) => set("showEmail", v)} />
            <Toggle field="details.phone" label="Show our phone number" checked={c.showPhone === true} onChange={(v) => set("showPhone", v)} />
            <p className="text-xs text-mute">The email and phone come from <Link className="font-semibold text-pink-dark underline" href={`${base}/details`}>Wedding details</Link>. They stay private unless you switch them on here.</p>
          </FieldFrame>
        </div>
      );
    case "wedding_party":
      return (
        <div className="space-y-6">
          {header({ intro: true })}
          <ListField field="members" title="People" items={arr<{ name: string; role: string | null; bio: string | null; mediaId: string | null }>(c.members)}
            max={30} addLabel="Add a person" onChange={(members) => set("members", members)}
            create={() => ({ name: "", role: null, bio: null, mediaId: null })}
            itemLabel={(m, i) => m.name || `Person ${i + 1}`}
            renderItem={(m, update, i) => (
              <>
                <TextField label="Name" value={m.name} maxLength={100} required onChange={(e) => update({ name: e.target.value })} />
                <TextField label="Role (optional)" value={m.role ?? ""} maxLength={100} placeholder="Maid of honour" onChange={(e) => update({ role: e.target.value || null })} />
                <TextArea label="A line about them (optional)" value={m.bio ?? ""} maxLength={300} rows={2} onChange={(e) => update({ bio: e.target.value || null })} />
                <ImageField field={`members.${i}.photo`} label="Photo" canHide={false} value={{ mediaId: m.mediaId, alt: null, hidden: false }}
                  onChange={(img) => update({ mediaId: asImage(img).mediaId })} />
              </>
            )} />
        </div>
      );
    case "registry":
      return (
        <div className="space-y-6">
          {header({ intro: true })}
          <ListField field="links" title="Registry links" items={arr<LinkItem>(c.links)} max={10} addLabel="Add a link"
            onChange={(links) => set("links", links)} create={() => ({ label: "", url: "https://", description: null })}
            itemLabel={(l, i) => l.label || `Link ${i + 1}`}
            renderItem={(l, update) => (
              <>
                <TextField label="Name" value={l.label} maxLength={60} required placeholder="Our registry" onChange={(e) => update({ label: e.target.value })} />
                <TextField label="Link" type="url" inputMode="url" value={l.url} maxLength={2048} required hint="Must start with https://" onChange={(e) => update({ url: e.target.value.trim() })} />
                <TextField label="Short description (optional)" value={l.description ?? ""} maxLength={300} onChange={(e) => update({ description: e.target.value || null })} />
              </>
            )} />
          <p className="text-xs text-mute">Guests open these links in a new tab. Olava doesn&apos;t handle gifts or payments.</p>
        </div>
      );
    case "video": {
      const video = (c.video ?? {}) as { videoMediaId?: string | null; posterMediaId?: string | null };
      return (
        <div className="space-y-6">
          <TextElementField field="eyebrow" label="Small label" value={c.eyebrow} maxLength={120} onChange={(v) => set("eyebrow", v)} />
          <TextElementField field="heading" label="Title" value={c.heading} maxLength={150} canHide={false} onChange={(v) => set("heading", v)} />
          <TextElementField field="body" label="Description (optional)" value={c.body} maxLength={1000} multiline rows={3} onChange={(v) => set("body", v)} />
          <VideoField field="video" videoMediaId={video.videoMediaId ?? null} posterMediaId={video.posterMediaId ?? null}
            onChange={(next) => set("video", next)} />
        </div>
      );
    }
    case "custom":
      return (
        <div className="space-y-6">
          {header({ headingLabel: "Title" })}
          <BlocksEditor blocks={arr<ContentBlock>(c.blocks)} onChange={(blocks) => set("blocks", blocks)} />
        </div>
      );
    case "footer":
      return (
        <div className="space-y-6">
          <TextElementField field="line" label="Closing line" value={c.line} maxLength={200} placeholder="Your names" hint="Leave empty to show your names." onChange={(v) => set("line", v)} />
          <TextElementField field="badge" label="Footer note" value={footerBadge(c)} maxLength={80} placeholder={FOOTER_BADGE_DEFAULT}
            hint="Small text at the very bottom of your website. Change it to anything you like, or switch it off."
            onChange={(v) => { const { showBadge: _old, ...rest } = c; void _old; onContent({ ...rest, badge: v }); }} />
          <FieldFrame field="credits" className="space-y-4">
            <p className="text-sm text-mute">Closing credits (Cinematic designs): the words before your names, your families, your wedding party and your venue.</p>
            <LabelField field="credits.starring" label="Before your names" value={c.starringLabel} fallback="Starring" maxLength={40} onChange={(v) => set("starringLabel", v)} />
            <LabelField field="credits.with" label="Before your families" value={c.withLabel} fallback="With" maxLength={40} onChange={(v) => set("withLabel", v)} />
            <LabelField field="credits.featuring" label="Before your wedding party" value={c.featuringLabel} fallback="Featuring" maxLength={40} onChange={(v) => set("featuringLabel", v)} />
            <LabelField field="credits.location" label="Before your venue" value={c.locationLabel} fallback="Filmed on location" maxLength={40} onChange={(v) => set("locationLabel", v)} />
          </FieldFrame>
        </div>
      );
  }
}

/** Problems that would make the API reject the section; autosave waits until they are fixed. */
export function draftIssue(section: Section): string | null {
  const c = section.content;
  const blank = (v: unknown) => typeof v !== "string" || v.trim() === "";
  const badHttps = (v: unknown) => typeof v !== "string" || !/^https:\/\/[^\s/]+\.[^\s]+/i.test(v);
  if (section.type === "custom") {
    for (const b of arr<ContentBlock>(c.blocks)) {
      if ((b.type === "heading" || b.type === "text") && blank(b.text)) return "A text block is empty.";
      if (b.type === "button" && (blank(b.label) || (badHttps(b.url) && !/^(mailto:|tel:)\S+$/i.test(b.url)))) return "A button needs text and a valid link.";
      if (b.type === "map" && blank(b.name)) return "A map block needs a place name.";
      if (b.type === "map" && b.url && badHttps(b.url)) return "A maps link must start with https://.";
      if (b.type === "video" && !b.videoMediaId && !b.videoId && b.url === undefined) return "Upload a video or paste a YouTube or Vimeo link.";
      if (b.type === "video" && !b.videoMediaId && b.url !== undefined && !b.videoId && !/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com)\//i.test(b.url))
        return "Paste a YouTube or Vimeo link.";
    }
  }
  if (section.type === "video" && blank((c.heading as { text?: string } | undefined)?.text)) return "Give the video a title.";
  if (section.type === "faq" && arr<{ question: string; answer: string }>(c.items).some((q) => blank(q.question) || blank(q.answer))) return "Each question needs an answer.";
  if (section.type === "wedding_party" && arr<{ name: string }>(c.members).some((m) => blank(m.name))) return "Each person needs a name.";
  if (["registry", "travel", "dress_code", "explore", "thank_you"].includes(section.type) && arr<LinkItem>(c.links).some((l) => blank(l.label) || badHttps(l.url)))
    return "Each link needs a name and an https:// address.";
  if (section.type === "story" && arr<Chapter>(c.chapters).some((ch) => blank(ch.title))) return "Each chapter needs a title.";
  if (["travel", "dress_code", "explore", "thank_you"].includes(section.type)) {
    const items = arr<InfoItem>(c.items);
    if (items.some((it) => blank(it.title))) return "Each item needs a title.";
    if (items.some((it) => it.url && badHttps(it.url))) return "Item links must start with https://.";
    if (items.some((it) => (it.colors ?? []).some((col) => !HEX.test(col)))) return "Colours must be written as #rrggbb.";
  }
  return null;
}

/** Up to five colour swatches for a dress-code item (the colour story guests can dress in). */
function Swatches({ colors, onChange }: { colors: string[]; onChange: (colors: string[]) => void }) {
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-sm font-semibold">Colours (optional)</legend>
      <p className="text-xs text-mute">Up to five colours guests can wear, shown as swatches by designs that have them.</p>
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((col, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full border border-line bg-white py-1 pl-1 pr-2">
            <input type="color" aria-label={`Colour ${i + 1}`} value={HEX.test(col) ? col : "#000000"} className="h-7 w-8 cursor-pointer rounded-full border-0 bg-transparent"
              onChange={(e) => onChange(colors.map((c, j) => (j === i ? e.target.value : c)))} />
            <button type="button" className="text-xs text-mute hover:text-ink" aria-label={`Remove colour ${i + 1}`} onClick={() => onChange(colors.filter((_, j) => j !== i))}>✕</button>
          </span>
        ))}
        {colors.length < 5 ? (
          <button type="button" className="rounded-full border border-dashed border-line px-3 py-1.5 text-sm font-semibold text-pink-dark"
            onClick={() => onChange([...colors, colors.at(-1) ?? "#d9a85b"])}>+ Add a colour</button>
        ) : null}
      </div>
    </fieldset>
  );
}
