# Phase 1 checklist: wedding website + RSVP MVP

**Last updated:** 2026-10-18 (editor upgrade: sections v2, see §E). **Branches:** `dev` in both repositories (changes delivered uncommitted; the owner commits).

**Continuing in a new chat?** Read this file, then `AGENTS.md` in both repositories, then `../Olava-back-end/docs/backend-api-changes.md`. Pick up the first item marked ⬜ or ⚠️ below.

**Status key:**
- ✅ done and verified (the evidence column says how);
- ⚠️ partial or done with a caveat;
- ⛔ blocked (needs something outside the code);
- ⬜ not started;
- ➖ out of Phase 1 scope by decision.

**Evidence abbreviations:**
- **BT** = backend xUnit test class (`Olava-back-end/src/Olava.Tests`), 73 tests.
- **VT** = Vitest (`tests/`), 70 tests.
- **ED** = Playwright `e2e/editor.spec.ts` (phone-size editor journey).
- **E2E** = Playwright `e2e/journey.spec.ts`, which follows the journey steps in §B.
- **AX** = `e2e/a11y.spec.ts` (axe and 320px checks).

## Latest verification run (Linux build workspace: Node 22, .NET 10.0, PostgreSQL 16)

| Check | Result |
|---|---|
| `dotnet build` (backend) | 0 errors |
| `dotnet test Olava.Tests` | **73 / 73 passed** |
| `npm run lint` / `npm run typecheck` | clean |
| `npm test` (Vitest) | **70 / 70 passed** |
| `npm run build` | succeeds |
| `npx playwright test` | **51 / 51 passed**: full journey (desktop editor + editor axe), phone editor journey (incl. editor axe + 320px), 3 throttled section-navigation tests, template gallery (grouping, category filter in the address), 12 templates (Enchanted Garden and Modern Indian: open, every section, RSVP form spacing, music button, no errors), music settings, RSVP in the editor and preview, 16 axe pages, 15 pages at 320px |
| Live Razorpay sandbox payment | ⛔ **not executed**: no test keys supplied, and Razorpay is unreachable from the build workspace. Steps: backend `Readme.md` §4 |
| Run on the owner's Windows machine (Node 26, .NET 10.0.401, PostgreSQL 18) | ⬜ not yet: first thing to do |

## A. Decisions in force

| # | Decision |
|---|---|
| D1 | Backend changes are allowed. They are built and tested in the build workspace |
| D2 | Per-template **tiers**: Standard ₹699 (the 5 Classic templates), Premium ₹1,199 (Enchanted Garden and Modern Indian). **Placeholder prices**, stored in `pricing_tiers` |
| D3 | The slug can change until the first publish, then it is locked |
| D4 | No root domain yet: sites at `/w/{slug}`, QR codes at `/q/{code}`. Subdomains are ready behind `PUBLIC_ROOT_DOMAIN` |
| D5 | 17 production templates in 3 categories (section G). The three trial templates were removed (2026-10-18) |
| D6 | Publishing is always paid. Live until wedding date + 12 months, capped at purchase + 24 months. Upgrades pay the difference. Paid extension comes later |
| D7 | Google sign-in hidden (later) |
| D8 | Wedding delete is a hard delete; orders are kept for accounting |
| | English only; no Docker yet; `ConnectionStrings:DefaultConnection` is the correct key |
| | Wedding sites are `noindex` (shareable by link, not listed in search engines) |
| | Refunds are recorded but don't revoke publishing (policy undecided) |
| E1 | "Add section" offers FAQ, Travel & Stay, Contact, Wedding Party, Gift Registry, Countdown, and re-adding Our Story, Dress Code, Thank You, Gallery, RSVP |
| E2 | Map block = place card + "Open in Maps" link (no embedded map, no API key) |
| E3 | Gift Registry = links + note only (no UPI) |
| E4 | Hosts may hide the "Made with Olava Invites" footer line |
| E5 | Editor changes autosave to the draft |

## B. End-to-end journey (all steps in one Playwright test: E2E ✅)

| # | Step | Status |
|---|---|---|
| 1 | Register and sign in | ✅ |
| 2 | Create a wedding: a private draft, no payment needed | ✅ |
| 3 | Choose or switch the template and palette | ✅ |
| 4 | Add a venue (map link) and events | ✅ |
| 5 | Edit section content, hide an optional section, reorder, save | ✅ |
| 6 | Preview the draft (mobile and desktop frames) before payment | ✅ |
| 7 | Add guests manually | ✅ |
| 8 | CSV import: a file with errors imports nothing and shows row errors; a valid file goes check → import; export | ✅ |
| 9 | Gallery: upload, caption, reorder, remove | ✅ |
| 10 | See the package and price before checkout | ✅ |
| 11 | Publishing blocked before payment (server-side); the draft URL shows nothing | ✅ |
| 12 | Failed payment grants nothing; successful payment is verified server-side | ✅ via the local fake provider + signed webhook (not a sandbox) |
| 13 | Publish | ✅ |
| 14 | Stable public URL shown | ✅ |
| 15 | Guest opens the site signed out and RSVPs; no guest data visible | ✅ |
| 16 | WhatsApp share link and copy link | ✅ |
| 17 | QR PNG downloads and decodes to the stable `/q/` URL, which opens the site | ✅ |
| 18 | Draft edits don't change the live site until republish | ✅ |
| 19 | Unpublish: page, QR route and images become unavailable | ✅ |
| 20 | Another user can't reach this wedding, its guests, preview or media | ✅ (also BT `TenantIsolationTests`) |

## C. Requirements (BRD v1.2, Phase 1 P0, plus P1 items done early)

### Account and project

| ID | Requirement | Status | Evidence / notes |
|---|---|---|---|
| ACC-01 | Register, sign in, sign out, recover access | ✅ | Email + password and Google (2026-10-20, section J). Email through Resend, or printed to the console when `Email:EmailSendingEnabled` is false. E2E `auth.spec.ts`, `journey.spec.ts`; BT `AuthGraceTests`, `EmailVerificationAndGoogleTests`. Real Google and real Resend still to be tried by the owner (`Olava-back-end/docs/auth-setup.md`) |
| ACC-02 | Wedding profile: names, title, date, time zone, contact, language | ✅ | Details page; BT `WeddingDraftTests` (time-zone rebasing, slug rules). Language is English only by decision |
| ACC-03 | Guided onboarding with defaults and preview | ✅ | `/dashboard/new` → design/events with a welcome hint; overview checklist; preview |
| ACC-05 | Draft / published / unpublished / archived states | ✅ | BT `PublishingTests` (archive rules), E2E 13, 19 |
| ACC-06 | Delete the event and its personal data | ⚠️ | Hard delete (typed confirmation) removes guests, RSVPs, media files and the snapshot; orders kept. BT `WeddingDraftTests`. **Account deletion and backup retention period are not defined** (privacy policy pending) |
| FR-PRJ-01 | Create and save a draft before purchase | ✅ | E2E 2 |
| FR-PRJ-02 | Return to an unpaid draft, change template, customise, preview | ✅ | E2E 3–6 |
| FR-PRJ-03 | Drafts and their guests private, not public or indexable | ✅ | E2E 11, 20; `/preview` is noindex and owner-only; BT `PublishingTests` |

### Templates and website

| ID | Requirement | Status | Evidence / notes |
|---|---|---|---|
| FR-TPL-01 | Templates made of reusable sections | ✅ | `SectionCatalog` + `SiteRenderer` |
| FR-TPL-02 | Enable or disable optional sections; essentials stay | ✅ | Any section can be hidden, deleted and re-added except Welcome, Events and Footer (required). Hiding/deleting RSVP shows a warning. "Rituals" can be built as a custom section (heading, text, photos, video). BT `SectionsV2Tests`, ED |
| FR-TPL-03 | Edit headings, text, images, event details, visibility; preview | ✅ | Every text and photo is editable and hideable, with tap-to-edit in the live preview. E2E 5–6, ED, VT `Editor`/`SiteRenderer`, BT `SectionsV2Tests` |
| FR-TPL-04 | Reorder sections | ✅ | Drag handle (touch, mouse, keyboard) and ↑/↓. ED, VT `Editor`, BT |
| FR-TPL-05 (P1) | Layout variants | ✅ | Gallery grid/carousel; Events cards/timeline |
| FR-TPL-06 (P1) | Approved theme settings | ✅ | Each template has its own tuned colours and fonts; the picker shows colour or font choices only when a template has more than one. Contrast checked (AX) |
| FR-TPL-08 (P1) | Switch templates, keep content, flag unsupported sections | ✅ | Every layout renders every section type, so nothing is lost or unsupported. BT `WeddingDraftTests` |
| FR-TPL-07 (P2) | Add optional sections from a curated library; no arbitrary HTML | ✅ (early) | "Add section" library and custom sections with 8 validated block types. No HTML; video is YouTube/Vimeo id only. BT, ED |
| FR-TPL-09 | Template versions separate from wedding content | ✅ | `template_versions` immutable; insert-only seed; publication snapshot pins the version |
| WEB-01 | Curated mobile-first templates | ✅ (stage 1 of 3) | 17 in the catalogue (D5); 6 designs live so far (Enchanted Garden). AX at 320px |
| WEB-02 | Edit names, text, colours, fonts, photos, order, visibility, layouts | ✅ | |
| WEB-03 | Live preview and publish workflow | ✅ | E2E 6, 13 |
| WEB-04 | Hero, story, schedule, venue/maps, gallery, RSVP, FAQ | ✅ | VT `SiteRenderer` |
| WEB-05 | Platform subdomain URLs | ⚠️ | Implemented (`PUBLIC_ROOT_DOMAIN` → `proxy.ts` rewrite; API `PublicSite:RootDomain`) but **not exercised**: no domain yet (D4). Path URLs are used |
| WEB-06 | Social metadata and dynamic OG image | ✅ | E2E 15 checks og:title, robots noindex, OG image PNG |

### Events

| ID | Requirement | Status | Evidence / notes |
|---|---|---|---|
| EVT-01 | Multiple functions (mehendi, haldi, nikah, …) | ✅ | Event type list + free text; up to 30 |
| EVT-02 | Date, start/end, venue, map link, dress code, notes, cover image | ✅ | E2E 4; map links http(s) only |
| EVT-03 | Timeline or card layout | ✅ | Layout variant |

### RSVP and guests

| ID | Requirement | Status | Evidence / notes |
|---|---|---|---|
| FR-RSVP-01 / GST-01 / GST-02 | Guest RSVP with host settings: attending, not, undecided; plus-ones; message | ✅ | BT `PublicRsvpTests`; VT `RsvpForm`; E2E 15. Honeypot and rate limit |
| FR-RSVP-02 / GST-04 | Host roster: search, filter, add, edit, remove, counts | ✅ | BT `GuestTests`; E2E 7 |
| FR-RSVP-03 / GST-05 | CSV import/export: documented format, row errors, duplicates, privacy | ✅ | BT `GuestTests`; VT `CsvImport`; E2E 8. Format in the backend API doc §5. Export neutralises formulas |
| GST-07 | Guests can't see other guests' data | ✅ | Site model has no guest data (VT, E2E 15) |
| GST-03 (P1) | Meal/dietary, per-event attendance | ➖ | P1, not built |
| | Duplicate website RSVPs | ⚠️ | Each public RSVP creates a new guest (no name matching, for privacy). Host tidies up; merge help is a later item |

### Sharing

| ID | Requirement | Status | Evidence / notes |
|---|---|---|---|
| FR-SHR-01 | Downloadable QR only after publish, to the stable URL | ✅ | E2E 17; BT `PublishingTests` (409 for drafts). PNG and SVG |
| FR-SHR-02 | QR stays valid across edits; unpublished goes to a neutral page | ✅ | `/q/{code}` → slug lookup; E2E 18–19 |
| WAP-01 | Share to WhatsApp | ✅ | `wa.me` link; E2E 16 |

### Payments and publishing

| ID | Requirement | Status | Evidence / notes |
|---|---|---|---|
| FR-PAY-01 | Everything before payment | ✅ | E2E 2–9 |
| FR-PAY-02 | Package, price, features, terms shown before checkout; prices in config | ⚠️ | Price and features come from the DB (`pricing_tiers`). **Purchase terms text is a placeholder** (`/terms`, "needs legal review") |
| FR-PAY-03 | Server-side verification, never the browser | ✅ | Signature + payment re-fetch + webhook signature. BT `PaymentTests` |
| FR-PAY-04 | Order, provider ref, amount, status, timestamps, idempotency | ✅ | `orders`, `payments`, `payment_events` (unique ids) |
| FR-PAY-05 | Entitlement only after verified payment for the correct wedding | ✅ | `PaymentProcessor`; BT |
| FR-PAY-06 | Backend enforces entitlement; actionable rejection | ✅ | `publish.payment_required` with blockers; E2E 11 |
| FR-PAY-07 | Failure, cancel, pending, duplicates, delays, retries | ✅ | BT (concurrent duplicate webhooks, out-of-order events, reconcile, late capture); VT `CheckoutButton` |
| FR-PAY-08 | Sandbox mode and documented E2E tests for success/failure/cancel/delay/duplicate/invalid | ⚠️ / ⛔ | Automated with HTTP mocks (BT) and a fake provider (E2E). **Live sandbox run blocked**: needs the owner's Razorpay test keys. Manual script in the backend `Readme.md` §4 |
| FR-PAY-09 | Purchase status and next steps; refund policy | ⚠️ | Purchases list + status on the Publish page. **Refund/chargeback policy undecided**: refunds are recorded and publishing stays |
| UPI-03/04/05 | UPI wording; no UPI secrets in pages | ✅ | Payment only via Razorpay Checkout; no UPI ids stored |

### Gallery

| ID | Requirement | Status | Evidence / notes |
|---|---|---|---|
| FR-GAL-01 / MEM-01 | Upload, preview, reorder, caption, remove | ✅ | Drag or ←/→ to reorder, captions save on blur, in the Gallery tab and inside the Gallery section editor. E2E 9; BT `MediaTests` |
| FR-GAL-02 / MEM-02 | Type and size limits, optimisation, ownership | ✅ | Decoded server-side, WebP 2000/480 px, EXIF/GPS stripped, 10 MB, 50 MP; BT isolation |
| FR-GAL-03 | Host-managed only | ✅ | No guest uploads |
| MEM-06 | Upload limits, moderation, retention rules | ⚠️ | Limits done. Removed images vanish from the live site immediately. **Retention policy text pending**; no abuse-report form yet |

### Non-functional

| Area | Status | Evidence / notes |
|---|---|---|
| Responsive, 320px | ✅ | AX at 320px on public pages and templates. Dashboard reviewed by screenshots at phone width only |
| Accessibility | ✅ | AX on 7 pages (WCAG 2.1 AA); labelled fields; `<dialog>` modals; reduced motion. A manual screen-reader pass is still recommended |
| Security | ✅ | HttpOnly cookies, Server Action origin checks, CSP and security headers, rate limits, strict validation, trusted forwarded headers. CSP allows `'unsafe-inline'` (trade-off in Readme01) |
| Multi-tenancy | ✅ | Global filter + write guard; BT `TenantIsolationTests`; E2E 20 |
| Privacy | ⚠️ | Guest data never public; noindex. **Privacy policy and terms are placeholders** needing legal review |
| Data lifecycle | ⚠️ | Wedding delete done. Backup/restore documented (backend Readme §5). Retention periods undefined |
| Performance | ⚠️ | Server-rendered public pages, WebP images, self-hosted fonts. **Core Web Vitals not measured** on real devices |
| Observability | ⚠️ | Structured ASP.NET logs, `/health`, `audit_events`, `payment_events`. No error tracking or metrics service yet |
| Analytics (Phase 1 list) | ⬜ | No product analytics yet (needs a privacy-reviewed provider choice) |
| Support process | ⬜ | Not defined (business task) |
| Monitoring / hosting | ⬜ | No hosting chosen. Production storage (S3/R2/Azure Blob) via `IFileStorage` is still to do |

## E. Editor upgrade: sections v2 (requested 2026-10-18)

| # | Requirement | Status | Evidence / notes |
|---|---|---|---|
| 1 | Every text and image editable; each text element hideable; layout/styling stay with the template | ✅ | Eyebrows, headings, intros, bodies, hero lines and footer are `{text, hidden}`. Photos `{mediaId, alt, hidden}`. Fixed wording ("Get directions", countdown, RSVP form) is editable but not hideable (form labels must stay visible). Names and date come from Details (hero links there). BT, VT, ED |
| 2 | Add, remove, reorder, show/hide any section; mobile Sections screen with drag handles, ↑/↓, visibility toggle, delete with confirmation | ✅ | `SectionsPanel`, `SortableList`. ED (touch drag + arrows + toggle + delete), VT |
| 3 | Custom sections: optional title + heading, text, image, gallery, video (YouTube/Vimeo), button, divider, map blocks; reorderable | ✅ | `BlocksEditor`, `sections/Custom.tsx`. Map = place card with "Open in Maps" (decision 2a: no embed or API key). BT (all types, 13 unsafe cases), ED |
| 4 | Predefined sections via Add section | ✅ | FAQ, Travel & Stay, Contact, **Wedding Party** (new), **Gift Registry** (new: links + note, decision 3a), Countdown, plus re-adding Our Story, Dress Code, Thank You, Gallery, RSVP (decision 1) |
| 5 | Gallery: reorder (drag + left/right), captions, remove | ✅ | `GalleryManager` (Gallery tab and Gallery section). E2E 9 |
| 6 | Structured, validated data separate from the template; draft only until publish; migrate existing projects; server-side validation; limits | ✅ | `wedding_sections` v2 with `revision`; upgrader converts drafts and live snapshots (BT `SectionsUpgradeTests`; ran on the e2e database: 11 sections and 1 snapshot converted). Limits: 40 sections, 15 custom, 30 blocks, 24 photos per gallery block, 64 KB per section; https-only links. Footer note editable and hideable (decision 4; see H6) |
| 7 | Live preview; tap-to-edit in a bottom sheet on mobile, side-by-side on desktop | ✅ | `SiteEditor`. Autosave (decision 5a) with "Saving…/Saved/Not saved yet" status. ED (phone), E2E 5 (desktop) |
| 8 | Tests, checklist, docs | ✅ | +21 backend tests, +8 Vitest, new `editor.spec.ts`, editor axe checks. Docs: backend API doc §15, `Readme01.md` (editor), `readmedoc.md` Step 4b, both `AGENTS.md` |

**Not verified here:**
- **Video playback:** the build workspace can't reach YouTube or Vimeo. The embed URL and security policy are tested; the network request was blocked by the workspace, not by the site.
- **Real phone:** tested on Chromium's phone emulation only.
- **Phone view:** the "Phone view" button shows the *saved* draft (CSS breakpoints follow the window, not the panel), so typing appears there after the autosave.

## F. Section navigation loader and speed (requested 2026-10-18)

| # | Requirement | Status | Evidence / notes |
|---|---|---|---|
| 1 | Loader is the supplied SVG as an inline React component | ✅ | `components/loading/OlavaLoader.tsx` |
| 2 | Template colours (CSS variables, derived shades, light-tint outline), every template incl. Maroon | ✅ | `--loader-color` from `readableThemeColor` (Maroon → `#7a2b45`, since its gold accent is too light on the dashboard); `color-mix` gradient and tint. VT, `navigation.spec.ts` (computed colours) |
| 3 | Fill bottom → top, hold, fade (no jump), loops until ready | ✅ | CSS keyframes in `globals.css`. Screenshots reviewed (fill, full, fading) |
| 4 | Show after ~200 ms, at least ~400 ms once shown | ✅ | `loaderStore`. VT (fake timers), navigation spec (measured) |
| 5 | In the content area; header and tabs stay; no layout shift | ✅ | `SectionContent` overlay over the current section. Navigation spec checks the tabs' document position |
| 6 | Status announcement, unique ids, reduced motion | ✅ | Polite live region "Loading section…", `useId` ids, pulse with reduced motion. VT, navigation spec |
| 7 | Fix the cause | ✅ | Intent prefetch, 30/60 s client cache, editor code warm-up, one parallel data round on Design, request de-duplication, cached catalogue. **`loading.tsx` was tried and removed**: React's 300 ms reveal throttle made fast switches 4× slower (`Readme01.md`) |
| 8 | Throttled mobile test and automated tests | ✅ | Slow 4G + 4× CPU measurements (`Readme01.md`), `e2e/navigation.spec.ts`, `tests/components/Loader.test.tsx` |

**Side fix:** leaving the editor less than 0.7 s after typing used to drop that last edit. It's now saved on leave (navigation spec).

## G. Production templates (requested 2026-10-18)

Delivered in stages. **Stage 1:** catalogue, grouping and filters, the move off the trial templates, new sections, family lines, music, and the Enchanted Garden design. **Stage 2 (delivered 2026-10-19):** Modern Indian design. **Stage 3 (delivered 2026-10-19):** the five Classic designs. All 17 templates now have their design. (2026-10-20: five Cinematic templates added from folder 004; see section I.) (A template whose design isn't built yet stays listed in the API but hidden from the gallery and picker, and existing websites on it use the simple fallback layout.)

| # | Requirement | Status | Evidence / notes |
|---|---|---|---|
| 1 | Remove the trial templates; add the supplied ones; don't keep the 001/002/003 structure | ✅ | `CatalogSeed`: 17 templates. One folder per design under `src/templates/designs/`. Trial templates hard-deleted at start-up after moving weddings (Blush Garden → English Garden, Ivory Gold → Ivory Letterpress, Royal Maroon → Rani & Gold; same tier). On the e2e database: 3 removed, 9 weddings and 4 live sites moved. BT `CatalogueAndMusicTests` |
| 2 | Category grouping with type (category) and price filters | ✅ | Gallery grouped under category headings; chips for type and price, combined, kept in the address (`?type=&price=`), empty state. The picker and the new-wedding form are grouped too. In the editor panel the picker drops its card and duplicate title, stays two columns, and no longer spills past the panel (`fieldset` `min-w-0`, 2026-10-19). Picker cards show **Live preview** / **Use this** on hover or tap, like the gallery: the preview shows the saved draft in that template (`/preview/[id]?template=`, `withTemplate` in `templates/draft.ts`, nothing saved), and Use this applies it at once; colour and font choices apply on tap (no Apply button). VT `draft.test.ts`, E2E `journey.spec.ts` updated (not yet re-run). VT `catalog.test.ts`, E2E `templates.spec.ts` |
| 2a | Categories: 003 → Classic; 001 → Enchanted Garden; 002 → Modern Indian | ✅ | Owner approved the names |
| 2b | Tiers: Classic Standard; the other two Premium | ✅ | BT |
| 3 | No section menu on the 002 and 003 designs (001 never had one) | ✅ | Modern Indian: no menu bar, drawer or "back to top"; the hero buttons are kept, worded from their sections. Classic: no header bar, mobile menu, English Garden side menu or "back to top"; Heirloom's "Contents" page is gone (its title spread now faces the invitation and a plate). VT `Designs.test.tsx`, E2E (no `nav` on any sample) |
| 4 | Rebuilt as Olava designs (editable, reusable for future templates) | ✅ all three types | **Classic** (5 designs, one template each, no music): a shared section kit (`designs/classic/`: generic sections, layout CSS, gallery viewer, day tabs, opening) plus each design's hero, headings, artwork and signature sections. Black Tie: gold rays and arch rise on opening, Deco event cards, arched story rows with outlined numerals, filmstrip gallery, dress-code icons. English Garden: side panel with growing branches (countdown in it), story timeline, order of the day, card sections. Heirloom: crest drawn on opening ("Open the book" skips), book spread, every section a chapter numbered by CSS, registry as the epilogue. Ivory Letterpress: invitation card whose gold frame draws itself, countdown line, oval vignettes, programme with dotted leaders, ruled reply card. Riviera: coastline hero, key-facts bar, events in day tabs, numbered travel, picture tiles, masonry gallery, navy/sand RSVP. Embedded maps → Open in Maps cards; own RSVP forms → the shared form. **Enchanted Garden, Modern Indian:** 6 themes each, every section type, tap to edit. Modern Indian: sealed-envelope opening, marigold garland, palace arch (the couple's photo replaces the illustration), story cards, colour-banded events, photo collage with viewer, map cards, accordion for travel, colour-story dress rows, RSVP band, petal shower; default music Raga Bhupali. Breakpoints are container queries, so the editor preview lays out at its own width. Guide: `docs/adding-templates.md` |
| 5 | New editable section types for every template | ✅ | Welcome note, Save the date (scratch card), Venue (Open in Maps cards), Dress code, Travel & stay, Things to do. BT, ED |
| 6 | Parents' line and a second line under each name, optional and hideable | ✅ | VT `Designs.test.tsx`, E2E editor |
| 7 | Music: built-in melodies, own upload, icon (6), colour, fixed corner (top or bottom right), can be turned off; Premium only | ✅ | MP3/M4A up to 10 MB, one track, rights confirmation required. Starts when the invitation opens. The Music panel has a listen/pause button per track (also before music is switched on); one sound at a time (panel samples and the preview button pause each other), and samples stop when the browser tab is hidden or the panel closes (2026-10-19, not yet covered by E2E). BT, VT, E2E `templates.spec.ts` |
| 8 | Maps as an elegant Open in Maps card | ✅ | `MapCard`, styled per theme |
| 9 | Templates open and work; grouping and filters work together | ✅ | E2E per template (all 17: opens, every starter section, RSVP form sizes, music only on Premium, no menu or iframe, no console errors); a11y (axe) and 320 px for all 17 samples; gallery: three groups (Classic 5, Enchanted Garden 6, Modern Indian 6), type + price combined (`?type=classic&price=standard`), Classic + Premium shows the empty state, Premium alone hides Classic. Editor checked by screenshot for each Classic design. VT 89, E2E 66 |

## H. RSVP form in every mode, and its styling (reported 2026-10-18)

| # | Issue / requirement | Status | Evidence / notes |
|---|---|---|---|
| 1 | The editor showed a placeholder instead of the RSVP form | ✅ | The real form, look-only (`inert`). Tapping it opens the RSVP settings; settings (e.g. "Not sure yet") show at once. VT `SiteRenderer`, E2E `templates.spec.ts` |
| 2 | Private preview and gallery: try the form | ✅ | Same checks as the live form; sending shows "This is a preview, so your reply wasn't sent"; nothing reaches the guest list. VT, E2E |
| 3 | Live form cramped (fields, spacing) | ✅ | Cause: the design's `* { margin: 0; padding: 0 }` reset beat the form's Tailwind classes. Now a shared form (`src/templates/rsvp/`) with its own stylesheet and theme variables: 50 px fields, answer cards, guests stepper, centred, two columns for phone and email on wide screens. Checked in all six themes by screenshot; size checks in E2E per template and on the live site (journey) |
| 4 | Guests: stepper instead of a dropdown | ✅ | Shown after "Joyfully accept", limited to the host's maximum. VT |
| 5 | Errors | ✅ | Focus moves to the first problem; each error clears as soon as that field is changed. VT |
| 6 | Footer: an editable note instead of the "Made with Olava Invites" switch (requested 2026-10-19) | ✅ | Text element `badge` (up to 80 characters, hideable), default "Regards from Olava Invites"; tap it in the preview to edit. Older footers keep working (switch off → note hidden), on the live site too, without republishing. BT `SectionsV2Tests`, VT `SiteRenderer`/`Editor` |

## I. Templates from folder 004: the Cinematic collection (requested 2026-10-20)

Folder 004 held five templates that are one film-style design in five colourways. They are converted into one Olava design (`cinematic`) with five themes. The supplied names, layout, artwork and colours are kept. Only sections and functionality changed to match the other templates. The owner approved all ten conversion decisions ("ok to all").

| # | Requirement | Status | Evidence / notes |
|---|---|---|---|
| 1 | Convert each 004 template, keeping layout, look and colours | ✅ | Noor, Royal Gold, Emerald Maharani, Rose Dusk, Midnight Sapphire: new category **Cinematic**, Premium. `CatalogSeed` (22 templates). Kept: diya title card with loading count and letterbox opening, split-letter hero over the palace skyline with embers, word-by-word prologue, pinned sideways story reel with frame counter, a page tint per event, cast billing, parallax stills with viewer, venue scene, palette rows, credits roll, film grain, the cursor ring (mouse only). Light themes: two small-text tones deepened for AA contrast (hue kept). Thumbnails captured from the built site |
| 2 | Sections aligned with the other templates | ✅ | **RSVP:** the shared Olava form, themed (dropped the supplied per-night choice, dietary dropdown, required email and browser-only storage). **Music:** Olava music button, with a new built-in melody **Diya score** (raga Yaman), the default for Cinematic. **Maps:** Open in Maps cards instead of the iframe. **Credits:** built from the wedding's data, with editable labels (Starring, With, Featuring, Filmed on location). **Opening:** its lines come from the hero eyebrow and tagline; new editable `openingNote` ("Our film begins with music", shown only when music is on). **Events:** editable Time and Place labels. **Dress code:** up to 5 colour swatches per item, editable, shown in **every** design. Removed: cursor words, hero video. Starter sections: hero, countdown, welcome, story, events, wedding party, gallery, venue, travel, dress code, RSVP, FAQ, footer |
| 3 | No 004 folder structure in the project; grouped by style | ✅ | One folder `src/templates/designs/cinematic/` (design, opening, engine, stills, artwork, CSS with one file per theme); registered with the others. Folder 004 on your computer is untouched |
| 4 | Each template opens and works, including RSVP | ✅ | E2E `templates.spec.ts` (all 22 templates: opening, every section, RSVP form sizes, music, no menu or iframe, no console errors); E2E `cinematic.spec.ts` (a published Midnight Sapphire site: guest opens it, RSVPs, the reply appears in Guests "Via website"); a11y (axe) and 320 px for all five; the RSVP try-it and opening checked on all five at 390 and 1440 px; the editor checked for all five (no console errors). VT `Designs.test.tsx`. BT `CatalogueAndMusicTests` (category, starters, Diya default, swatch validation, new labels). VT 105, E2E 82, BT 74 |

## J. Sign-in: Google, email verification codes, Resend (requested 2026-10-20)

Setup guide: `Olava-back-end/docs/auth-setup.md`. The owner approved all twelve design decisions ("ok to all"). There is no production domain yet; the guide uses `<your-domain>`.

| # | Requirement | Status | Evidence / notes |
|---|---|---|---|
| 1 | Google sign-in next to email + password | ✅ | "Continue with Google" / "Sign up with Google" (shown only when the API has Google configured). Server-side authorization code + PKCE; the API validates Google's ID token. New Google users get an account and workspace and go to "create your wedding". BT, E2E `auth.spec.ts` (stand-in Google) |
| 2 | Same email as an existing account → link, no duplicate | ✅ | Linked by email; a verified account keeps its password. An account that never verified its email has its password removed and sessions revoked (pre-hijacking protection). BT (both cases), E2E (same weddings after Google) |
| 3 | Email + password sign-ups verify with an emailed code (not a link) | ✅ | Code screen `/verify-email`; a correct code signs in. Unverified accounts that sign in (after the right password) are sent a code and shown the code screen. Old link confirmation removed. BT, E2E |
| 4 | Code expires (10 min), limited tries (5), new code with cooldown (60 s) | ✅ | All configurable (`Auth:Otp`), plus a cap of 5 codes per hour. Stored as an HMAC, single use; a new code replaces the old one. BT: expiry, wrong → tries left, lock, replacement, cooldown, hourly cap. Checked on the running stack too (expired, 5 wrong → locked, the right code then refused, cooldown 60 s) |
| 5 | Google users skip verification | ✅ | Only Google accounts with `email_verified` are accepted. BT, E2E (no email sent) |
| 6 | Resend for all email; `EmailSendingEnabled`; `RequireEmailVerification`; key and sender in configuration | ✅ | `Email:EmailSendingEnabled`, `Auth:RequireEmailVerification`, `Email:FromAddress`, `Email:FromName`, `Email:Resend:ApiKey` (user-secrets). Sending off → nothing sent, the whole email (with the code) printed in the console; verified on the running API. Verification off → signed in at once, no email; verified on the running API. Start-up refuses "sending on" without a key. Resend refusal → sign-up still works, "send a new code" at once. BT, E2E (stand-in Resend) |
| 7 | Existing accounts not locked out | ✅ | Migration `EmailVerificationCodes` marks existing accounts verified once |
| 8 | Real Google / real Resend | ⏳ owner | Not reachable from the build environment. Follow `auth-setup.md` §2–§4 |

## K. Sample content, first-run walkthrough, "no venue" warning, Video section (requested 2026-10-23)

The owner approved the design ("ok to all", then the second round): samples only in the editor and private preview, Countdown pre-ticked, a map-link helper, the venue auto-select, a cover photo for videos, and a 5-character password minimum. Evidence: BT = `Olava.Tests/VideoAndSetupTests.cs`; UT = `tests/unit/setup-samples-video.test.ts`; CT = `tests/components/SetupFeatures.test.tsx`; E2E = `e2e/setup.spec.ts`.

| # | Requirement | Status | Evidence / notes |
|---|---|---|---|
| 1 | Empty sections show sample content, clearly marked, replaced by the couple's own | ✅ | Editor and private preview only. Each sample section carries the tag "Sample: hidden on your live site until you add your own" (a button in the editor that opens the section), and the Sections list shows a "Sample" badge. Covers story, events, venue, gallery, travel, dress code, things to do, wedding party, FAQ, registry and video. The couple's own heading is kept. Checked visually in every design family. UT, CT, E2E (appear; gone after a real FAQ and event) |
| 2 | Samples never confuse the live site | ✅ | The live site never shows samples; empty sections are left out as before. The Publish page lists the sections still showing samples, with links into the editor, and never blocks publishing. CT, E2E (live site: no tags, empty story absent) |
| 3 | First-login walkthrough: the two of you → choose sections → one form per chosen section → done | ✅ | Starts for anyone with no wedding (`/dashboard` → `/dashboard/new`). Pre-ticked: story, events (always included), countdown, gallery, RSVP. Unticked sections are hidden, not deleted. Countdown, venue, contact and save-the-date have no form. "Step X of Y" with a progress bar, Back, and "Skip this for now" on every step. E2E (whole path, including step counts) |
| 4 | Answers saved as you go; resume later | ✅ | Each step saves on Next, Back (leniently) and Skip. The video saves as soon as it's uploaded. Progress is stored with the wedding (`setup_json`), and the dashboards show "Finish setting up (Step X of Y)" with Continue / Dismiss. BT (setup endpoints), E2E (Back keeps the story, Skip → resume card → continue at RSVP → finish → card gone) |
| 5 | Chosen sections control what the site shows | ✅ | BT (hidden, not deleted; required always on), E2E (gallery left out, dress code and video shown) |
| 6 | Warning when saving an event without a venue | ✅ | "No venue selected": "This event will appear on your website without a location. Do you want to continue anyway?" with **Go back** / **Continue without venue**. With no venues yet, it adds "You haven't added any venues yet…" and **Add a venue**. It never blocks saving, and there's no warning when a venue is chosen. Event rows without a venue get a "No venue" badge. CT (all branches), E2E (walkthrough and Events tab) |
| 7 | Fewer forgotten venues | ✅ | A venue created from the event form ("+ New venue" or "Add a venue") is selected automatically. A new event preselects the only venue, or the most recent event's venue. UT, CT, E2E |
| 8 | Event cards look clean with no venue | ✅ | No location line, no map link, and no Venue section on the live site. CT in all 9 design families (including Basic), E2E on a published Modern Indian site |
| 9 | Map-link helper | ✅ | A "?" next to "Map link (optional)": hover, focus or tap shows the Google Maps **Share → Copy link** steps for phone and computer; Escape or tapping elsewhere closes it |
| 10 | Video section: title (required), description (optional), the video, cover photo (optional) | ✅ | Built-in section (up to 3 per wedding); the custom-section video block also accepts uploads. Upload progress with Cancel, preview, Replace, Remove (with confirmation). An empty description leaves no empty element. BT, E2E |
| 11 | Under 30 MB, MP4/WebM only, checked in the browser and on the server | ✅ | Browser: checked on pick ("This video is larger than 30 MB. Please choose a smaller file."; `.mov` and other types refused with export hints). Server: size, and the file's real contents (WebM header; MP4 with H.264; QuickTime, HEVC, audio-only and renamed files refused). The website's upload route answers with the same size message even above the API's hard limit. UT, BT (exactly 30 MB accepted, +1 byte refused), E2E (31.5 MB, `.mov`, `.avi` in the browser; renamed JPEG, HEVC, >30 MB and >31 MB straight to the route) |
| 12 | Plays inline on the site, no autoplay, works on phones, fits the template | ✅ | `<video controls playsinline preload="metadata">` with range streaming. Styled by each design. While it plays with sound the music pauses; it resumes when the video pauses or ends; starting the music pauses the video. CT, E2E (390px phone context on the published site: plays, music pauses and resumes). **Note:** the test browser (open-source Chromium) can't decode H.264, so in-browser playback was exercised with WebM; MP4 serving and range requests are covered by BT |
| 13 | Video sample content and walkthrough step | ✅ | A sample still frame with a play mark, until a video is uploaded. Video is offered in the walkthrough. UT, E2E |
| 14 | Where videos are stored | ✅ | `src/Olava.Api/App_Data/storage` on the API server's disk, the same as images. No setup or cost locally. In production the main cost is bandwidth (up to 30 MB per full view); object storage such as Cloudflare R2 is the future option. Backend `Readme.md`, `backend-api-changes.md` §12b |
| 15 | Password minimum 5 characters | ✅ | Register, reset, and the website's forms and hints (owner decision 2026-10-23) |

Fixed along the way (found by the new tests):
- The event and venue forms lost what was typed when the "No venue" question or an error sent the person back. They now submit with `onSubmit`, so nothing is reset.
- Every Modal and BottomSheet used the same title id, so a dialog opened over another (for example "No venue selected" over "Add event") was announced with the wrong name. Each now has its own id (`useId`).
- Escape on the map-link tip also closed the "Add venue" dialog around it, losing what was typed. Now Escape closes only the tip (E2E).
- Existing specs updated for the new flow: weddings are created through `skipSetupToEvents()`, the editor spec answers the no-venue question and picks "YouTube or Vimeo link" (new video blocks start on upload).

## L. Walkthrough: visual design picker, more moments, easier events, finding the editor (requested 2026-10-26)

The owner approved the proposal (all five points, with Kerala and Indian event types). Evidence: E2E = `e2e/setup.spec.ts` (walkthrough and decide-later tests); BT = `VideoAndSetupTests.Decide_later_…`; UT = `tests/unit/setup-samples-video.test.ts`.

| # | Requirement | Status | Evidence / notes |
|---|---|---|---|
| 1 | A visual template picker with live preview instead of the dropdown | ✅ | New step 2 "Choose your design", after the names, so the walkthrough is one step longer (Step 1 of 8). Picture cards with name, type, package and price ("Premium · ₹1,199 to publish"), music badge and colour dots, plus type and price filters. Live preview shows the couple's own names and date at phone, tablet or desktop size, with "Choose this design" beside the size buttons. The dropdown is gone from step 1 (and from step 1 reached with Back). A template picked in the public gallery arrives preselected. E2E, checked visually on desktop and phone |
| 2 | "Select a template later" | ✅ | "Decide later" card, selected until a design is chosen. The walkthrough carries on, and the sections chosen are kept when a design is applied later, in order with the welcome banner first. "You're all set" shows "One thing left: choose a design"; the Design tab and preview say "Choose a design". BT, E2E |
| 3 | Story: add more moments, remove them, empty ones not shown | ✅ | Starts with one moment (or the saved ones), "+ Add a moment" up to 12 (the API limit), ↑/↓ to reorder, Remove (asks first only if filled). Each moment has an optional photo. Empty moments are never saved; a filled one without a title is pointed out. Example text now reads "e.g. …" in every walkthrough form. E2E |
| 4 | Several events easily | ✅ | Every event is an open card. "+ Add another event" adds one straight away, and suggestion chips add pre-named events (Engagement, Madhuramvekkal, Mehendi, Haldi, Sangeet, Wedding, Nikah, Reception). Cards start on the wedding date (or the previous card's), so only the time is left. Venue per card, with "+ New venue" selecting the new venue on that card. Dress code, description, notes, cover and visibility are under "More details". Delete asks first for saved or filled events. Everything saves on Next (Back and Skip keep complete events); empty cards are ignored; a missing name, date or time is shown on its card. One "No venue selected" question names the events without a venue ("Sangeet and Wedding have no venue…"). E2E |
| 5 | Event types for Kerala and Indian weddings | ✅ | Engagement (Nischayam), Betrothal (Manasammatham), Madhuramvekkal, Mehendi / Mylanchi, Haldi, Sangeet, **Wedding** (replaces "Ceremony"), Nikah, Reception, Walima, Cocktail night, Other. They're shared by the Events tab and the walkthrough. An event saved earlier as "Ceremony" keeps that type and it stays in its list. The sample event is now "Wedding". UT |
| 6 | After the walkthrough, where to edit or change the template | ✅ | "You're all set" lists what's next: **Edit your website** (open the editor), **Change the design** (opens the editor with the Template panel) and **See it as guests will**. The dashboard preview has "✎ Edit this website" and "🎨 Change template". The full-screen preview's top bar has the same links (not inside frames). The editor shows a one-time "This is where you edit your website" tip (Got it). The tab is renamed **Edit & design**. `design?panel=template` opens the Template panel. E2E |

## M. UI fixes: long names, step bar, editor (requested 2026-10-26)

The owner approved the review ("ok" to all four questions) and asked for alignment and usability fixes wherever needed. Evidence: E2E = `e2e/setup.spec.ts`, `e2e/long-names.spec.ts`; checked visually on desktop and phone.

| # | Problem | Status | Fix and evidence |
|---|---|---|---|
| 1 | The design step's Next is far below 22 cards | ✅ | Every walkthrough step has a step bar pinned to the bottom of the screen (Back, Skip this for now, the current choice, Next/Finish). The design step shows "Selected: Rani & Gold" or "Decide later"; the sections step shows "5 selected". E2E (bar and Next in view without scrolling) |
| 2 | "What's next" buttons at different heights | ✅ | Each card's button sits at the bottom of its card. "Go to the dashboard" is a plain link under a divider |
| 3 | "This is where you edit your website" looked messy | ✅ | Four equal tiles (icon, title, one line), "Got it" in the heading row. The duplicate line under the toolbar is gone; once dismissed, a one-line reminder takes its place. E2E |
| 4 | Long names broke designs | ✅ | `src/templates/FitText.tsx`, in every design. Large text whose longest word doesn't fit is scaled down just enough, never below 42% of the design's size. "Doesn't fit" means: its own block, any clipping frame (an arch), any visible card (the envelope letter) or the page. A check of where the text actually landed then catches off-centre or over-wide boxes. Lines wrap at ordinary spaces (names joined by non-breaking spaces count as one word); a word that still can't fit breaks as a last resort. It re-fits on width changes, font loading, text changes and reveals (an opening finishing), throttled to once per 200 ms. Ordinary names change nothing. Before: 11 of 22 templates clipped "Anandhakrishna S & Amrithalekshmi B" on a phone. Fixed along the way: with "reduce motion" on, every element gets a tiny transition, so sizes read back stale; the fitter now pauses transitions while it measures. E2E `long-names.spec.ts`: all 22 templates at 320, 390 and 1280px with "Anandhakrishna Sreekumar & Amrithalekshmi Balachandran" (none off screen or cut by a frame, no sideways scrolling), and the sample sites with ordinary names unchanged |
| 5 | "Your current design" label looked wrong | ✅ | The current design's hover layer shows only Live preview; the card keeps its "Current" badge, and its preview says "✓ Your current design" |
| 6 | "Use this template" hidden below the live preview | ✅ | The main button sits beside Mobile/Tablet/Desktop in every template preview (walkthrough, editor, public gallery). The preview is sized to the window, so the window doesn't scroll. E2E (journey) |
| 7 | No quick way back to the top in Edit & design | ✅ | A round "↑" button appears after scrolling, for the page and for the side panel. Switching panels (Sections, Template, Music, a section) starts that panel at its top. E2E |
| 8 | Section names cut off in the Sections list | ✅ | The name has its own line; Hidden, Sample and the section's heading sit underneath. One "Sample" note at the top of the list replaces the repeated line |
| 9 | Smaller alignment fixes | ✅ | Story moments and event cards have a header row (name, ↑/↓/Remove or Delete). "+ New venue" is a button the same height as the venue list (walkthrough and Events tab). "More details" is a clear text toggle naming what's inside. The "Decide later" text points to Edit & design |

## N. Password fields, section order, editable cover photos (requested 2026-10-31)

Evidence: E2E `e2e/templates.spec.ts` (order on every sample site), `e2e/auth.spec.ts`; API tests `SectionsV2Tests` (every design starts in the usual order; the walkthrough keeps it); browser checks on the register/sign-in forms and in the editor.

| # | Problem | Status | Fix and evidence |
|---|---|---|---|
| 1 | A failed sign-in/register cleared the password | ✅ | `useKeepValuesSubmit` submits without React's form reset (sign in, register, new password). Every password field has a Show/Hide button. A field's error goes away as soon as it's edited (`TextField`/`TextArea`) and comes back on the next failed submit |
| 2 | RSVP not last | ✅ | `SectionCatalog.DefaultOrder`: welcome, countdown, welcome note, save the date, story, wedding party, events, venue, dress code, travel, things to do, gallery, video, registry, FAQ, contact, thank you, custom, RSVP, footer. A new website's starter sections (every design) and template previews follow it; sections added by the walkthrough go where they usually belong and keep the couple's own order. Existing websites are not reordered |
| 3 | Cover photos didn't look editable | ✅ | Photos in the editor show a "📷 Change photo" chip. Tapping an event (or its cover photo, now tappable in Cinematic, Heirloom, Ivory Letterpress and English Garden's photo row) opens that event, cover photo included, right in the editor. Black Tie and Riviera's background photos have a "📷 Change the photo…" button at the top of the welcome banner |

## D. Limitations and open decisions (for the owner)

1. **Run a live Razorpay test-mode payment** with your keys (backend `Readme.md` §4). Until then, payments are verified only against mocks.
2. **Email:** Resend is wired in (section J). To send real email, add your Resend key and, before launch, verify a sending domain (`Olava-back-end/docs/auth-setup.md` §2).
3. **Legal:**
   - Privacy policy and terms (placeholders, marked "needs legal review").
   - Refund/chargeback policy.
   - Data retention periods.
4. **Prices** are placeholders (₹699 / ₹1,199). Change them in `pricing_tiers`, not in code.
5. **Missing content options:**
   - The "Rituals" section, if wanted.
   - Meal/dietary RSVP fields (P1).
6. **Production setup:**
   - Object storage for images and videos (videos make bandwidth the main hosting cost).
   - Shared Data Protection keys.
   - A distributed rate limiter with multiple servers.
   - A domain with wildcard DNS for subdomains.
7. **Concurrent editing:** sections now detect stale saves (`section.conflict`). Wedding details, events and guests still use last-save-wins.
8. **Public RSVPs** always create a new guest. A merge tool comes later.
9. **Paid extension** after the live period ends (D6) is not built. Expired sites show "This celebration has ended" (410).
