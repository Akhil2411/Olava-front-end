/**
 * TypeScript mirrors of the .NET API contracts (see Olava-back-end/docs/backend-api-changes.md).
 * Keep in sync with Olava.Application/*Contracts.cs. Business rules live in the API, not here.
 */

export type WeddingStatus = "Draft" | "Published" | "Unpublished" | "Archived";

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantRole: string;
  platformRoles: string[];
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: UserSummary;
  /** True when this sign-in created the account (Google). */
  isNewAccount?: boolean;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  emailVerificationRequired: boolean;
  codeSent: boolean;
  resendAvailableInSeconds: number;
}

export interface ResendCodeResponse {
  codeSent: boolean;
  resendAvailableInSeconds: number;
}

/** Public values for starting Google sign-in (the client secret never leaves the API). */
export interface GoogleSignInConfig {
  enabled: boolean;
  clientId: string | null;
  authorizationEndpoint: string | null;
  redirectUri: string;
  scope: string;
}

export interface Me {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  tenantRole: string;
  platformRoles: string[];
}

export interface TemplateRef {
  key: string;
  name: string;
  versionNumber: number;
  tierCode: string | null;
}

/** First-run walkthrough progress ("done" for weddings created before it existed). */
export interface WeddingSetup {
  status: "in_progress" | "skipped" | "done" | "dismissed";
  /** "sections", a section type (that section's form) or "done". */
  step: string | null;
  sections: SectionType[];
}

export interface WeddingSummary {
  id: string;
  title: string;
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: string | null;
  status: WeddingStatus;
  template: TemplateRef | null;
  hasUnpublishedChanges: boolean;
  createdAt: string;
  updatedAt: string | null;
  setup?: WeddingSetup | null;
}

export interface Wedding {
  id: string;
  slug: string;
  slugLocked: boolean;
  status: WeddingStatus;
  title: string;
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: string | null;
  timeZoneId: string;
  preferredLanguage: string;
  contactEmail: string | null;
  contactPhone: string | null;
  template: TemplateRef | null;
  theme: { palette: string | null; font: string | null };
  draftRevision: number;
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
  firstPublishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  setup?: WeddingSetup | null;
}

export interface Palette {
  key: string;
  name: string;
  background: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
}

export interface FontOption {
  key: string;
  name: string;
  heading: string;
  body: string;
}

export interface TemplateTier {
  code: string;
  name: string;
  rank: number;
  priceMinor: number;
  currency: string;
}

export interface Template {
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  isPremium: boolean;
  versionNumber: number;
  /** The design that renders this template (src/templates/designs). */
  layout: string;
  tier: TemplateTier | null;
  sections: string[];
  palettes: Palette[];
  fonts: FontOption[];
  defaultPalette: string;
  defaultFont: string;
  /** Design capabilities, e.g. "music". */
  features: string[];
  /** The sections a new website on this template starts with, in order (the footer is added automatically). */
  defaultSections: string[];
  /** Thumbnail uploaded in the admin panel (a relative URL), if any. */
  previewImageUrl?: string | null;
}

export type SectionType =
  | "hero" | "welcome" | "save_the_date" | "countdown" | "story" | "events" | "venue" | "gallery" | "rsvp" | "faq"
  | "travel" | "dress_code" | "explore" | "thank_you" | "contact" | "wedding_party" | "registry" | "video" | "custom" | "footer";

/** @deprecated use SectionType */
export type SectionKey = SectionType;

/** Editable, hideable text (sections v2). */
export interface TextElement {
  text: string | null;
  hidden: boolean;
}

/** Stored (draft) image reference. */
export interface ImageElement {
  mediaId: string | null;
  alt: string | null;
  hidden: boolean;
}

export interface LinkItem {
  label: string;
  url: string;
  description: string | null;
}

export type BlockType = "heading" | "text" | "image" | "gallery" | "video" | "button" | "divider" | "map";

/** Custom-section block as stored (draft). The site model replaces mediaId(s) with image refs. */
export type ContentBlock = { id: string; hidden: boolean } & (
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "image"; mediaId: string | null; caption: string | null; alt: string | null }
  | { type: "gallery"; mediaIds: string[] }
  | { type: "video"; provider: "youtube" | "vimeo" | null; videoId: string | null; title: string | null; url?: string; videoMediaId?: string | null; posterMediaId?: string | null }
  | { type: "button"; label: string; url: string }
  | { type: "divider" }
  | { type: "map"; name: string; address: string | null; url: string | null }
);

/** One draft section from GET /weddings/{id}/sections. Content shape depends on `type` (see templates/content.ts). */
export interface Section {
  id: string;
  type: SectionType;
  label: string;
  isRequired: boolean;
  isSingleton: boolean;
  isPinnedLast: boolean;
  isEnabled: boolean;
  sortOrder: number;
  layoutVariant: string | null;
  layoutVariants: string[];
  content: Record<string, unknown>;
  revision: number;
  disableWarning: string | null;
}

export interface SectionTypeInfo {
  type: SectionType;
  label: string;
  description: string;
  isSingleton: boolean;
  canAdd: boolean;
}

export interface SectionsResponse {
  sections: Section[];
  library: SectionTypeInfo[];
}

export interface Venue {
  id: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  mapUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface WeddingEvent {
  id: string;
  name: string;
  eventType: string | null;
  description: string | null;
  startsAtLocal: string;
  endsAtLocal: string | null;
  startsAt: string;
  endsAt: string | null;
  dressCode: string | null;
  notes: string | null;
  venueId: string | null;
  coverMediaId: string | null;
  sortOrder: number;
  isVisible: boolean;
}

export interface Media {
  id: string;
  purpose: "Gallery" | "Hero" | "Story" | "EventCover" | "Section" | "Other" | "Music" | "Video";
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

export type RsvpStatus = "attending" | "not_attending" | "undecided" | "pending";

export interface Guest {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  groupName: string | null;
  maxPlusOnes: number;
  source: "Host" | "Import" | "Website";
  notes: string | null;
  rsvp: { status: Exclude<RsvpStatus, "pending">; plusOneCount: number; message: string | null; respondedAt: string } | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface GuestSummary {
  totalGuests: number;
  responded: number;
  pending: number;
  attending: number;
  notAttending: number;
  undecided: number;
  attendingHeadcount: number;
  plusOnes: number;
}

export interface CsvRowError {
  row: number;
  column: string | null;
  message: string;
}

export interface CsvImportResult {
  dryRun: boolean;
  committed: boolean;
  totalRows: number;
  toCreate: number;
  toUpdate: number;
  skippedDuplicates: number;
  errors: CsvRowError[];
}

export interface Tier {
  code: string;
  name: string;
  description: string | null;
  rank: number;
  priceMinor: number;
  currency: string;
  features: string[];
  liveMonthsAfterWedding: number;
}

export interface CheckoutQuote {
  kind: "purchase" | "upgrade" | "none";
  requiredTier: Tier;
  currentTier: Tier | null;
  amountDueMinor: number;
  creditMinor: number;
  currency: string;
  paymentsConfigured: boolean;
  templateName: string | null;
}

export interface CheckoutSession {
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  provider: string;
  providerOrderId: string;
  providerKeyId: string;
  description: string;
  prefill: { name: string | null; email: string | null };
}

export type OrderStatus = "Pending" | "Paid" | "Failed" | "Refunded" | "Cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  weddingId: string | null;
  productCode: string;
  tierCode: string | null;
  status: OrderStatus;
  amountMinor: number;
  creditMinor: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  failureReason: string | null;
}

export type PublishBlocker =
  | "archived" | "template_missing" | "wedding_date_missing" | "events_missing"
  | "payment_required" | "upgrade_required" | "entitlement_expired" | "blocked_by_admin";

export interface PublishingStatus {
  status: WeddingStatus;
  slug: string;
  slugLocked: boolean;
  publicUrl: string | null;
  qrTargetUrl: string | null;
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
  entitlement: {
    tierCode: string;
    tierName: string;
    tierRank: number;
    grantedAt: string;
    liveUntil: string;
    isExpired: boolean;
  } | null;
  requiredTier: Tier | null;
  canPublish: boolean;
  blockers: PublishBlocker[];
}

export interface Share {
  publicUrl: string;
  qrTargetUrl: string;
  shareText: string;
  whatsAppUrl: string;
}

// ───────────── Site render model (preview + published snapshot) ─────────────

export interface SiteImage {
  ref: string;
  width: number | null;
  height: number | null;
  caption: string | null;
}

/**
 * A rendered section. Content is the stored content with every `mediaId` replaced by `ref/width/height`
 * and every `mediaIds` list by `images`. Published snapshots drop hidden text and hidden blocks; `id` is
 * only present in the private preview (the editor maps taps to sections with it).
 */
export interface SiteSection {
  id: string | null;
  key: SectionType;
  layoutVariant: string | null;
  content: Record<string, unknown>;
  /** Editor/preview only: the section is empty, so it shows sample content (and a "Sample" tag). Never on the live site. */
  sample?: boolean;
}

export interface SiteEvent {
  name: string;
  eventType: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  startsAtLocal: string;
  endsAtLocal: string | null;
  dressCode: string | null;
  notes: string | null;
  venue: {
    name: string;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    mapUrl: string | null;
  } | null;
  cover: SiteImage | null;
}

export interface SiteModel {
  couple: {
    title: string;
    partnerOneName: string;
    partnerTwoName: string;
    weddingDate: string | null;
    timeZoneId: string;
    language: string;
  };
  template: { key: string; name: string; versionNumber: number; layout: string };
  theme: { palette: Palette; font: FontOption };
  sections: SiteSection[];
  events: SiteEvent[];
  /** Editor/preview only: sample events shown in the Events and Venue sections while there are no real ones. */
  sampleEvents?: SiteEvent[];
  gallery: SiteImage[];
  rsvp: {
    enabled: boolean;
    deadline: string | null;
    allowUndecided: boolean;
    maxPlusOnes: number;
    collectMessage: boolean;
    isOpen: boolean;
  };
  contact: { email: string | null; phone: string | null; note: string | null } | null;
  generatedAt: string;
  schemaVersion?: number;
  /** Background music (Premium designs, when switched on). */
  music?: SiteMusic | null;
}

export type MusicTrack = "music-box" | "raga" | "diya" | "custom";
export type MusicIcon = "note" | "heart" | "rings" | "bell" | "flower" | "speaker";
export type MusicPosition = "bottom-right" | "top-right";

export interface SiteMusic {
  track: MusicTrack;
  /** Uploaded track: ref is a media id (preview) or public token (live site), served as variant "audio". */
  audio: { ref: string; contentType: string } | null;
  icon: MusicIcon;
  /** #rrggbb, or null for the design's accent colour. */
  color: string | null;
  position: MusicPosition;
}

/** Music settings in the editor (GET/PUT /weddings/{id}/music). */
export interface MusicSettings {
  available: boolean;
  enabled: boolean;
  /** null = the design's own melody (defaultTrack). */
  track: MusicTrack | null;
  defaultTrack: MusicTrack;
  upload: { mediaId: string; contentType: string; sizeBytes: number; fileName: string | null; rightsConfirmedAt: string | null } | null;
  icon: MusicIcon;
  color: string | null;
  position: MusicPosition;
}

export interface PublicSite {
  site: SiteModel;
  publicUrl: string;
  shareText: string;
  publishedAt: string;
}
