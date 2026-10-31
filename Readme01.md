# Olava frontend: developer reference

The technical companion to [`Readme.md`](Readme.md). It describes how the app is put together, why, and how to test and deploy it.

## Stack

| Package | Version | Why |
|---|---|---|
| next | 16.4.2 | App Router, Server Components, Server Actions, Route Handlers, `proxy.ts` |
| react / react-dom | 19.3 | |
| tailwindcss | 4 (via `@tailwindcss/turbopack`) | Design tokens in `src/app/globals.css` (`@theme`) |
| zod | 4 | Form validation in Server Actions (the API validates again) |
| @dnd-kit/core, /sortable, /utilities | 6.3 / 10 / 3.2 | Drag-and-drop reordering (touch, mouse and keyboard) in the editor and gallery |
| @fontsource/* | 5 | Self-hosted fonts (Inter, Playfair Display, Cormorant Garamond): no Google Fonts request, works offline |
| server-only | | Makes server modules fail the build if imported into client code |
| vitest, @testing-library/react, jsdom | | Unit and component tests |
| @playwright/test, @axe-core/playwright | | Browser journey, accessibility and 320px checks |

All packages are MIT or Apache-2.0 licensed. The fonts are under the SIL Open Font License.

## Architecture in one picture

```
Browser ──(HttpOnly cookies only)──► Next.js server (this app) ──(Bearer token, server-to-server)──► .NET API ──► PostgreSQL
                                     │ proxy.ts        refresh tokens, protect /dashboard, subdomain → /w/{slug}
                                     │ Server Components   read data via api()            (never cached)
                                     │ Server Actions      all mutations (built-in Origin check = CSRF protection)
                                     │ Route Handlers      relay files: images, CSV export, QR codes
```

- **The browser never sees a token and never calls the API directly.**
  - Sign-in stores `olava_at` (access, 15 min) and `olava_rt` (refresh, 14 days) as **HttpOnly, SameSite=Lax** cookies.
  - `Secure` is set in production or when `COOKIE_SECURE=true`.
- **`src/proxy.ts`** (Next 16's new name for middleware) runs on each matched request:
  1. Rewrites `{slug}.{PUBLIC_ROOT_DOMAIN}` to `/w/{slug}` when a root domain is configured.
  2. Refreshes the session when the access token is missing or expires within 60 s. Concurrent requests share one refresh per token.
  3. Redirects `/dashboard/**` and `/preview/**` to `/login?next=…` when signed out.
- **The API is the authority.** The proxy's checks are only for convenience. Every API call is authorised again, and another tenant's id returns 404, so the page shows "not found".
- **Nothing is cached.**
  - `api()` uses `cache: "no-store"`; Cache Components is off (`next.config.ts`).
  - Reason: almost every page depends on the session, and public sites must disappear the moment they are unpublished.
  - After a mutation, `revalidateWedding()` re-renders the dashboard.
- **One renderer for everything.** `src/templates/SiteRenderer.tsx` renders the API's `SiteModel` for the template gallery (sample data), the private preview (draft) and the public site (published snapshot), so all three look the same.
  - Templates are React code owned by the platform.
  - Customer content is plain text rendered by React, so it is escaped. HTML or scripts from users are never rendered.
  - Theme colours are validated as hex before becoming CSS variables (`src/templates/theme.ts`).

## Folder map

```
src/
  proxy.ts                  session refresh, route protection, subdomain rewrite
  app/
    (marketing)/            /, /templates, /privacy, /terms        (public)
    (auth)/                 /login, /register, /verify-email (one-time code), /forgot-password, /reset-password
    dashboard/              /dashboard, /dashboard/new, /dashboard/weddings/[id]/{details,events,design,gallery,guests,preview,publish,settings}
    preview/[id]            full-screen private draft preview (signed-in owner only, noindex)
    template-sample/[key]   a template with sample data (public)
    w/[slug]                the PUBLIC wedding website (+ opengraph-image) – published snapshot only
    q/[code]                stable QR destination → redirects to /w/{slug} (or shows "unavailable")
    api/…                   Route Handlers relaying images, CSV export and QR files from the API
  features/<area>/          data.ts (server reads), actions.ts (Server Actions), components/ (UI)
  features/editor/          the site editor: SiteEditor (layout), useSections (autosave), SectionsPanel, SectionForm,
                            BlocksEditor (custom sections), fields (text/photo/list inputs), SortableList (drag + arrows)
  templates/                SiteRenderer + sections/ (Hero, Basic: countdown…footer, Custom blocks), Editable (tap-to-edit
                            wrapper), content.ts (safe content readers), draft.ts (draft → preview), sample.ts
  components/ui|layout      design-system pieces (Button, Field, Modal, Alert…) and header/footer
  lib/
    api/                    server.ts (api, apiRaw), problem.ts (errors), loaders.ts (unwrap, assertId), actions.ts, relay.ts, types.ts
    session/                tokens.ts (cookies), session.ts (getCurrentUser, requireUser, safeNext)
    env.ts, forms.ts, utils/
tests/                      Vitest unit + component tests
e2e/                        Playwright: journey.spec.ts, auth.spec.ts, a11y.spec.ts, …; stand-ins fake-razorpay.mjs, fake-resend.mjs, fake-google.mjs; helpers.ts, photos
```

## Configuration (`.env.local`; see `.env.example`)

| Variable | Default | Meaning |
|---|---|---|
| `OLAVA_API_URL` | `http://localhost:5033` | The .NET API, reached only from the server |
| `PUBLIC_ROOT_DOMAIN` | empty | e.g. `olava.in` enables `{slug}.olava.in`. It needs wildcard DNS and TLS, plus the same value in the API's `PublicSite:RootDomain` |
| `COOKIE_SECURE` | `true` in production | Set `false` only for plain-HTTP local testing of a production build |

- There are **no `NEXT_PUBLIC_` variables**, and no secret is ever sent to the browser.
- The Razorpay *key id* (which is public by design) is delivered per order by the API.

**Public URLs (decision D4: no domain yet).**
- Sites live at `{PublicSite:BaseUrl}/w/{slug}`, e.g. `http://localhost:3000/w/asha-and-ravi`.
- QR codes encode `/q/{shortCode}`, which stays valid even if the slug changes before the first publish.
- The slug is locked after the first publish (decision D3).
- Public sites are `noindex`: shareable by link, not listed in search engines (privacy by default).

## Sign-in (email + password, email codes, Google)

Setup of Google, Resend and the switches: `Olava-back-end/docs/auth-setup.md`. The website has **no new settings**: it reads `GET /api/v1/auth/google/config` and shows "Continue with Google" only when the API has Google configured.

- **Email codes:**
  - When the API says a code is needed (after registering, or after a correct password on an unverified account), the server action stores `{email, next, resendAt, sent}` in the HttpOnly cookie `olava_verify` (30 minutes) and opens `/verify-email`.
  - The page posts the code (`verifyEmailAction`). On success the session cookies are written and the person goes on (new accounts to `/dashboard/new`).
  - "Send a new code" counts down from the API's cooldown (`resendCodeAction`).
  - The cookie isn't a credential: the emailed code is the proof, and the API checks it.
- **Google** (`src/app/api/auth/google/`):
  - `start` sets the HttpOnly cookie `olava_google`, which holds the OAuth `state`, the PKCE verifier and `next`. It lasts 10 minutes and is limited to `/api/auth/google`. `start` then redirects to Google.
  - `callback` checks `state` (constant-time), posts `{code, codeVerifier}` to the API, writes the session cookies and redirects: new accounts to `/dashboard/new`, others to `next`.
  - Any failure lands on `/login?error=…` with a message: cancelled, unverified Google email, not set up, or other.
  - The button is a plain `<a>` (a `<Link>` would prefetch it and start a sign-in).

## How a request flows (example: saving wedding details)

1. `app/dashboard/weddings/[id]/details/page.tsx` (Server Component) calls `getWedding(id)` from `features/weddings/data.ts`. That calls `api()`, which attaches the bearer token from the cookie.
2. It renders `DetailsForm` (Client Component), which uses `useActionState(updateWeddingAction)`.
3. On submit, `updateWeddingAction` in `features/weddings/actions.ts` runs **on the server**: it validates with zod, sends `PUT /api/v1/weddings/{id}`, maps the API's problem details to field errors, and calls `revalidateWedding()`.
4. Errors from the API keep their stable `code` (`lib/api/problem.ts`), so the UI can react to `wedding.slug_taken` and similar codes.

## Switching between a wedding's sections (loading and speed)

The section tabs (Overview, Details, Events, Design…) are dynamic, per-user pages. Measured on a phone with throttled Slow 4G and a 4× slower CPU:

| | Before | After |
|---|---|---|
| Tab switch, first visit | 250–450 ms (Design 710 ms), screen frozen | 70–150 ms when the tab was touched or hovered first (normal on phones); 250–460 ms with the loader if not |
| Revisit within 30 s | 250–300 ms | ~80–120 ms (client cache) |
| Unthrottled | 50–300 ms | 50–110 ms, no loader |

**What changed:**
- **Intent prefetch:** `WeddingNav` fully prefetches a tab on hover, touch or keyboard focus (`prefetch={true}` after intent).
- **Client cache:** `staleTimes` (`next.config.ts`) keeps visited and prefetched sections for 30/60 s. Server Actions clear it.
- **Editor code warm-up:** the editor's JavaScript is downloaded in the background once the dashboard is idle, so the first Design visit doesn't wait for it.
- **Fewer round trips:**
  - the Design page loads its data in one parallel round (it was two);
  - `getWedding` is de-duplicated per request;
  - the template catalogue is cached for 5 minutes.
- **No `loading.tsx`:** React holds Suspense content back for at least 300 ms after a fallback appears (`FALLBACK_THROTTLE_MS`), which turned 80 ms switches into 350 ms ones.
  - Instead, the current section stays on screen while the next one loads.
  - `useLinkStatus` (`<TrackNavigation/>`, built into the tabs and `LinkButton`) drives the loader.

**The loader** (`src/components/loading/`):
- **`OlavaLoader`:** an inline SVG with ids unique to each instance.
  - Its colour is `--loader-color`, set by the wedding layout from the active template (`readableThemeColor`): the accent, or the palette's darker colour when the accent is too light for the dashboard (Royal Maroon's gold → maroon).
  - Gradient stops and the light empty outline are derived from that colour with `color-mix`.
  - The animation is CSS: fill rises, holds, then fades out before restarting, so there's no jump. With reduced motion it's a gentle pulse.
- **`SectionContent`:** covers only the content area, so the header and tabs stay.
  - It appears only if loading takes more than 200 ms, stays at least 400 ms, and runs until the next section is rendered (`loaderStore`).
  - It announces "Loading section…" once in a polite live region.
  - The old section stays underneath (`aria-busy` and `inert`), so nothing shifts.

## Templates and designs

- **Long names:** `templates/FitText.tsx` runs inside every `SiteRenderer`. It scales down large text whose longest word doesn't fit (never below 42%) and re-fits on resize, font load, text changes and reveals. Designs don't need to do anything. `e2e/long-names.spec.ts` checks all templates at 320, 390 and 1280px; add a new template's key there.

- The **catalogue** (22 templates, each with a category and a pricing tier) lives in the API (`CatalogSeed.cs`).
- The **designs** that draw them live in `src/templates/designs/`, one folder per design (`enchanted-garden`, `modern-indian`, and the five Classic designs `black-tie`, `english-garden`, `heirloom`, `ivory-letterpress`, `riviera`, which share the section kit in `designs/classic/`; and `cinematic`, five Premium colourways of one film-style design). Several templates can share one design as colourways.
- `SiteRenderer` picks the design by the template's `layout`. Templates whose design isn't built yet are hidden from the gallery and fall back to a simple layout.
- **Gallery** (`/templates`): grouped by category, with type and price filters that combine and are kept in the address (`?type=classic&price=standard`).
- **Assets:** design stylesheets and self-hosted fonts are built into `public/designs/` by `npm run designs`, which runs before `dev` and `build`. Each website loads only its own design and fonts.
- **Music** (Premium designs):
  - a built-in melody (Music box, Raga Bhupali, or Diya score in raga Yaman, the Cinematic default), or the couple's own MP3/M4A (10 MB, rights confirmation required);
  - a floating button with a choice of icon, colour and corner;
  - it starts when the guest opens the invitation.
- **RSVP form** (`src/templates/rsvp/`): one form for every design and mode, themed with `--rsvp-*` variables.
  - Live site: replies go to the guest list.
  - Private preview and gallery: try it; nothing is sent.
  - Editor: the real form, look-only; tapping it opens the RSVP settings, and changes show at once.
- **Adding templates:** see `docs/adding-templates.md`.

## The site editor (Design tab)

Sections v2 content model and API: `../Olava-back-end/docs/backend-api-changes.md` §15.

- **Live preview.** `SiteEditor` renders the real `SiteRenderer` in mode `"edit"`:
  - The server preview supplies couple, events, theme and RSVP state.
  - The editor's local sections are swapped in through `withDraftSections`, so the preview changes as you type.
  - Every element is wrapped in `<Editable>`. A tap selects `{sectionId, field}`, and the section form scrolls to and focuses that field.
  - Hidden or empty elements show as dashed placeholders in the editor only.
- **Phone vs desktop:**
  - Below 1024px the editor opens in a `BottomSheet` (modal `<dialog>`).
  - On desktop the panel sits beside the preview.
  - "Phone view" shows the saved draft (`/preview/{id}`) in a 390px frame, because CSS breakpoints follow the window, not the panel.
- **Autosave** (`useSections`):
  - Text edits save 0.7 s after the last keystroke; toggles and layout save at once.
  - Each save sends the section's `revision`. On `section.conflict` the latest version is loaded and the host is told.
  - Anything typed during a save is kept and saved next.
  - `draftIssue()` holds back saves the API would reject (empty block, bad link) and shows why.
  - The browser warns before leaving with unsaved changes.
- **Sections screen:**
  - Rows are reordered by drag handle (long-press on touch) or ↑/↓.
  - Each row has a visibility switch and delete with confirmation; required sections can be edited but not hidden or deleted.
  - "Add section" opens the library; one-per-site types already present are disabled.
- **Custom sections:** heading, text, photo, gallery, video (an uploaded MP4/WebM or a YouTube/Vimeo link), button, divider and map blocks, reorderable the same way.
- **Gallery** (Gallery tab and inside the Gallery section): drag or ←/→ to reorder (optimistic), captions save on blur or Enter, remove with confirmation.

## First run, sample content and videos

- **Walkthrough** (`features/setup/`, route `/dashboard/setup/[id]?step=…`):
  - `/dashboard/new` is step 1 (the two of you). Creating the wedding opens "Choose your design" (`DesignStep`: picture cards, filters, live preview of the couple's draft via `/preview/{id}?template=…`, which also works before any template is applied, and "Decide later"). Then "choose sections", one short form per chosen section that has one (`OFFERED` and `stepsFor` in `steps.ts`), and "You're all set" with links to the editor, the Template panel (`design?panel=template`) and the preview.
  - Steps that aren't a single section save themselves through a `Saver` (`strict` on Next, lenient on Back/Skip). The design step applies the chosen template. `EventsStep` keeps every event as an open card, saves changed ones on Next, and asks once about events without a venue.
  - Event types and the walkthrough's suggestions live in `features/events/types.ts` (Kerala and Indian events).
  - Each step saves through Server Actions on Next / Back / Skip. Progress (`status`, `step`, `sections`) lives on the wedding (`PUT /weddings/{id}/setup`), so `SetupResumeCard` can offer "Finish setting up" on both dashboards.
  - Choosing sections calls `PUT /weddings/{id}/setup/sections`, which shows the chosen ones and hides the rest (never deletes).
- **Sample content** (`templates/samples.ts`):
  - `withSamples(site)` fills sections that `isSectionEmpty` reports as empty with the content in `templates/sample.ts`, and flags them `sample`.
  - `SiteRenderer` applies it only in modes `edit` and `preview`, so the live site never shows samples (empty sections stay hidden there).
  - `SectionEditChip` draws the "Sample" tag; `SectionsPanel` and the Publish page list sample sections.
  - When adding a section type, add its sample in `sample.ts` and its emptiness rule in `isSectionEmpty`.
- **Events and venues** (`features/events/components/EventForm.tsx`): saving without a venue asks first (never blocks). A venue added from the event form is selected, and new events preselect a likely venue (`defaultVenueId`). The map-link field has a `HelpTip`.
- **Videos:**
  - Uploads go through the Route Handler `app/api/weddings/[weddingId]/videos/route.ts`, not a Server Action, so `uploadVideo` (XMLHttpRequest) can show real progress. It streams the body to the API and refuses anything over the API's limit itself, with the size message.
  - `next.config.ts` raises `proxyClientMaxBodySize` to 32 MB for it.
  - Files are checked in the browser (`videoProblem`) and again by the API, which reads the file's real contents.
  - On the site, `designs/shared/VideoPlayer.tsx` plays inline. It "claims" the design's music while it plays with sound (`claimMusic`/`releaseMusic` in `designs/shared/events.ts`; `MusicButton` pauses and resumes).

## Payments in the browser

`features/billing/components/CheckoutButton.tsx`:

1. Asks the server to create an order. The **API** computes the amount from the database.
2. Loads `https://checkout.razorpay.com/v1/checkout.js` and opens Razorpay Checkout with the order id and public key id.
3. On success, sends `{order id, payment id, signature}` to the server. The API verifies the signature, re-fetches the payment from Razorpay, and captures it if needed.
4. If the result is still pending, it polls `GET /orders/{id}?reconcile=true`. The webhook finishes the order even if the page is closed.
5. When the window is closed, the order is cancelled. A payment that is captured later still completes it.

The browser's success callback alone never unlocks anything. **No live Razorpay sandbox payment has been made from this code yet** (see the backend Readme §4 for the one-time manual test).

## Tests

```powershell
npm run lint; npm run typecheck; npm test; npm run build
```

- **Vitest** (`tests/`), 137 tests (incl. `setup-samples-video.test.ts` and `SetupFeatures.test.tsx`: walkthrough steps, video file checks, samples on/off per mode, the no-venue question, venue-less event cards in every design, video/music hand-off; `auth.test.ts`: code input, step cookies, PKCE and the Google request; `VerifyEmailForm.test.tsx`: countdown and resend; `Designs.test.tsx`: every design and theme, its opening, editor mode and photo viewer; `Loader.test.tsx`: unique ids, theme-only colours, timing rules, announcement, theme colour choice per template):
  - Error mapping, session helpers, formatting.
  - SiteRenderer: all section types and custom blocks, hidden/empty elements, editor tap targets, safe links and video embeds, no private data.
  - Editor: draft→preview transform, autosave guard, Sections screen (arrows, toggle, confirm delete, library), section and block forms.
  - ShareButtons, CheckoutButton (success, failure, cancel, pending), CsvImport (row errors), RsvpForm.
- **Playwright** (`e2e/`): needs the full stack running.
  - `journey.spec.ts` runs the 20-step customer journey: register, draft, events, design, gallery, preview, guests and CSV, blocked publish, failed then successful payment, publish, share and QR (decoded), public RSVP, snapshot isolation, unpublish, cross-user isolation.
  - `editor.spec.ts` (phone size):
    - tap-to-edit in the bottom sheet, hiding a label, changing fixed wording;
    - deleting a section with confirmation, adding a custom section with every block type;
    - reordering blocks (arrows) and sections (touch drag and arrows), hiding a section;
    - axe and 320px checks on the editor;
    - the live site unchanged until republish, then everything present and hidden items absent.
  - `navigation.spec.ts` (phone size, throttled network):
    - a fast tab switch shows no loader;
    - a slow one shows the themed loader in the content area with the header unmoved, after ≥ ~200 ms, for ≥ ~400 ms, until the section is ready;
    - reduced motion → pulse;
    - leaving the editor mid-typing still saves, and coming back shows the edit.
  - `auth.spec.ts`: sign-up with an emailed code (wrong code → tries left, right code → signed in), an unverified account sent to the code screen at sign-in, Google for a new person and on return, Google linking to an existing password account (same weddings), and Google cancelled / unverified email / forged callback.
  - `templates.spec.ts` opens every one of the 22 templates (every starter section, RSVP form sizes, music on Premium only, no menu or embedded map, no console errors) and checks the gallery's groups and filters.
  - `setup.spec.ts`: the first-run walkthrough end to end (choose sections, forms, Back, Skip, resume, finish), sample content in the editor, preview and Publish page but never on the live site, the no-venue warning, and videos (browser and server rejections, Replace/Remove, inline playback on a phone, music pausing and resuming).
  - The other specs create weddings with `skipSetupToEvents()` (step 1, then skip the walkthrough).
  - `cinematic.spec.ts` publishes a Cinematic wedding; a guest opens it, RSVPs, and the reply reaches the guest list.
  - `a11y.spec.ts` runs axe WCAG 2.1 AA on the public pages and all 22 template samples, and a 320px no-horizontal-scroll check on the same pages. The journey also runs axe on the desktop editor.

### End-to-end tests (Windows)

The tests use **local stand-ins** for three outside services, because the real ones need a person or real accounts:
- `e2e/fake-razorpay.mjs` (:5099): the tests send correctly signed webhooks.
- `e2e/fake-resend.mjs` (:5098): the tests read the emailed code from it.
- `e2e/fake-google.mjs` (:5097): it signs in as the identity a test chooses, with real PKCE checks and RS256-signed ID tokens.

These prove Olava's side of each flow, **not** Razorpay, Resend or Google themselves.

Install Chromium for Playwright once with `npx playwright install chromium`. Then open three PowerShell windows:

```powershell
# window 1: the stand-ins
Start-Process node -ArgumentList "e2e\fake-razorpay.mjs"
Start-Process node -ArgumentList "e2e\fake-resend.mjs"
node e2e\fake-google.mjs

# window 2: the API on a separate, empty database, pointed at the stand-ins
psql -U postgres -h localhost -c "CREATE DATABASE olava_e2e;"
cd ..\Olava-back-end\src\Olava.Api
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Database=olava_e2e;Username=postgres;Password=<yours>"
$env:Payments__Razorpay__KeyId = "rzp_test_e2e"
$env:Payments__Razorpay__KeySecret = "e2e_key_secret"
$env:Payments__Razorpay__WebhookSecret = "e2e_webhook_secret"
$env:Payments__Razorpay__BaseUrl = "http://localhost:5099/v1/"
$env:Auth__RequireEmailVerification = "true"
$env:Email__EmailSendingEnabled = "true"
$env:Email__FromAddress = "hello@olava.test"
$env:Email__Resend__ApiKey = "re_e2e_fake"
$env:Email__Resend__BaseUrl = "http://localhost:5098/"
$env:Auth__Google__ClientId = "e2e-client.apps.googleusercontent.com"
$env:Auth__Google__ClientSecret = "e2e-google-secret"
$env:Auth__Google__Authority = "http://localhost:5097"
dotnet run --launch-profile http

# window 3: build and serve the website, then run the tests
npm run build; Start-Process npm -ArgumentList "start"
npm run test:e2e
```

- The `e2e_*` / `re_e2e_fake` values above are dummy test values, not real keys.
- `$env:` settings last only for that window, so they don't affect your normal development API.
- To start over, drop and re-create `olava_e2e`.
- The accessibility tests alone only need the website and API: `npx playwright test a11y`.

## Accessibility

- Semantic landmarks, a skip link, and labelled fields with `aria-describedby` errors.
- Focus-trapped modals; `prefers-reduced-motion` respected (countdown, transitions).
- Template colours were checked for WCAG AA contrast. Two accents were darkened during testing.

Automated axe checks are not a full audit. Test with a screen reader before launch.

## Security notes and trade-offs

- **CSP** allows `'unsafe-inline'` scripts. Nonce-based CSP would force every page to render dynamically and complicate caching later. The risk is reduced because all user content is rendered as escaped text and the only third-party script is Razorpay. Revisit before launch.
- **Uploads** go through a Server Action (limit 11 MB). The API decodes and re-encodes every image and strips EXIF/GPS.
- **Open redirects:** `safeNext()` only allows same-site relative paths after login, including the `next` carried through the code screen and Google sign-in.
- **Google sign-in:** `state` and the PKCE verifier live only in an HttpOnly cookie scoped to the callback path, and the client secret never reaches the website.
- **Ids in routes** are checked as UUIDs (`assertId`) before they reach API paths.

## Deployment notes (not done yet)

- Run `npm run build` and `npm start` behind HTTPS with `COOKIE_SECURE=true`.
- Set `OLAVA_API_URL` to the API's internal address.
- The API must trust this server's IP in `ForwardedHeaders:KnownProxies` so rate limits see real visitor IPs.
- The token-refresh de-duplication is per process. With several instances, the API's 30-second grace window prevents forced logouts.

## Known limitations

See `docs/phase1-checklist.md` → "Limitations and open decisions".
