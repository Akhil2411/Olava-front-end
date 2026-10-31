/**
 * Safe readers for rendered section content (sections v2). Content comes from the API as JSON; nothing here
 * trusts its shape. Everything is rendered as plain text by React (escaped), never as HTML.
 */

export interface SiteText {
  text: string | null;
  hidden: boolean;
}

/** An image element or image-bearing item in render form (mediaId already replaced by ref). */
export interface SiteImageRef {
  ref: string | null;
  width: number | null;
  height: number | null;
  alt?: string | null;
  caption?: string | null;
  hidden?: boolean;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const nonEmpty = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** A text element ({ text, hidden }). Tolerates a legacy plain string. */
export function textEl(content: Obj, key: string): SiteText {
  const v = content[key];
  if (typeof v === "string") return { text: nonEmpty(v), hidden: false };
  if (isObj(v)) return { text: nonEmpty(v.text), hidden: v.hidden === true };
  return { text: null, hidden: false };
}

export const FOOTER_BADGE_DEFAULT = "Regards from Olava Invites";

/**
 * The small line at the very bottom (editable and hideable). Content saved before it was editable has only a
 * `showBadge` switch: then it's the default wording, hidden when the switch was off.
 */
export function footerBadge(content: Obj): SiteText {
  if ("badge" in content) return textEl(content, "badge");
  return { text: FOOTER_BADGE_DEFAULT, hidden: content.showBadge === false };
}

/** The text to show on the site: null when hidden or empty. */
export function visible(content: Obj, key: string): string | null {
  const el = textEl(content, key);
  return el.hidden ? null : el.text;
}

/** A plain (non-hideable) label with a fallback, e.g. "Get directions". */
export function label(content: Obj, key: string, fallback: string): string {
  return nonEmpty(content[key]) ?? fallback;
}

export function nested(content: Obj, key: string): Obj {
  const v = content[key];
  return isObj(v) ? v : {};
}

export function bool(content: Obj, key: string, fallback = false): boolean {
  const v = content[key];
  return typeof v === "boolean" ? v : fallback;
}

export function str(content: Obj, key: string): string | null {
  return nonEmpty(content[key]);
}

export function list<T = Obj>(content: Obj, key: string): T[] {
  const v = content[key];
  return Array.isArray(v) ? (v.filter(isObj) as T[]) : [];
}

/** An image element in render form; `ref` is null when there is no (visible) image. */
export function imageEl(content: Obj, key = "image"): SiteImageRef {
  const v = content[key];
  if (!isObj(v)) return { ref: null, width: null, height: null, hidden: false };
  return {
    ref: nonEmpty(v.ref),
    width: typeof v.width === "number" ? v.width : null,
    height: typeof v.height === "number" ? v.height : null,
    alt: nonEmpty(v.alt),
    caption: nonEmpty(v.caption),
    hidden: v.hidden === true,
  };
}

export function images(v: unknown): SiteImageRef[] {
  return Array.isArray(v)
    ? v.filter(isObj).map((i) => ({
        ref: nonEmpty(i.ref),
        width: typeof i.width === "number" ? i.width : null,
        height: typeof i.height === "number" ? i.height : null,
        caption: nonEmpty(i.caption),
      })).filter((i) => i.ref)
    : [];
}

/** RSVP form wording (editable; empty values fall back to these defaults). */
export const RSVP_LABEL_DEFAULTS = {
  name: "Your name",
  attend: "Will you attend?",
  accept: "Joyfully accept",
  decline: "Regretfully decline",
  undecided: "Not sure yet",
  guests: "Guests coming with you",
  message: "Message for the couple",
  submit: "Send RSVP",
  thanks: "Thank you! We can't wait to celebrate with you.",
  closed: "RSVPs are now closed. Thank you!",
  deadline: "Please reply by",
  privacy: "Only the couple can see your reply and contact details.",
} as const;

export type RsvpLabels = { -readonly [K in keyof typeof RSVP_LABEL_DEFAULTS]: string };

export function rsvpLabels(content: Obj): RsvpLabels {
  const raw = nested(content, "labels");
  const out = {} as RsvpLabels;
  for (const key of Object.keys(RSVP_LABEL_DEFAULTS) as (keyof RsvpLabels)[]) out[key] = label(raw, key, RSVP_LABEL_DEFAULTS[key]);
  return out;
}

/** Only links the API allows (https, plus mailto:/tel: for buttons) are ever rendered as links. */
export function safeHref(url: unknown, allowContact = false): string | null {
  if (typeof url !== "string") return null;
  if (/^https:\/\/[^\s]+$/i.test(url)) return url;
  if (allowContact && /^(mailto:|tel:)[^\s]+$/i.test(url)) return url;
  return null;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^[0-9]{1,12}$/;

/** Embed URL for a validated provider + id (privacy-enhanced players only). Anything else: null. */
export function videoEmbedUrl(provider: unknown, id: unknown): string | null {
  if (provider === "youtube" && typeof id === "string" && YOUTUBE_ID.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  if (provider === "vimeo" && typeof id === "string" && VIMEO_ID.test(id)) return `https://player.vimeo.com/video/${id}?dnt=1`;
  return null;
}

export function mapsHref(name: string, address: string | null, url: unknown): string {
  return safeHref(url) ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(", "))}`;
}
