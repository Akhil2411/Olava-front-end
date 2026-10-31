# Adding a wedding website template

Templates are supplied as standalone websites: a folder per template with `index.html`, `style.css`, `script.js`, sometimes a `theme.css`, and a `README.md`. They are a **design reference**, not code we ship. Each one is rebuilt as an Olava **design**: a React component that draws the couple's own data (sections, events, gallery, RSVP, music). It must stay editable in the Design tab (tap to edit, hide, reorder, custom sections).

The folder names a template arrives in (`001`, `002`…) mean nothing. Group by **design**, not by delivery folder.

## Words used here

| Word | Meaning | Where |
|---|---|---|
| **Template** | What a couple picks: a key (`sage-garden`), name, category, pricing tier, colours, fonts | API catalogue (`CatalogSeed.cs`) |
| **Design** (layout) | The code that draws a website. Several templates can share one design (colourways) | `src/templates/designs/<design>/` |
| **Theme** | A template's colours and fonts inside its design: a `theme-<template>.css` file and a font list | design `css/` folder, `fonts.json` |
| **Category** | The style group shown in the gallery ("Enchanted Garden", "Modern Indian", "Classic", "Cinematic") | `Category` on the template |
| **Tier** | Standard or Premium: what the couple pays to publish | `TierCode` on the template |

Today: `enchanted-garden` (6 templates, Premium), `modern-indian` (6, Premium), five Classic designs (Standard, one template each, layout key = template key) and `cinematic` (5 templates, Premium: Noor, Royal Gold, Emerald Maharani, Rose Dusk, Midnight Sapphire).

## 1. Review the supplied files first

1. Open each `index.html` (phone width first) and read its README.
2. Decide:
   - which templates share one design: compare `index.html` and `style.css`;
   - the category;
   - the tier.

   Ask the product owner about tier, category names and anything that changes structure. Don't guess these.
3. List what the design shows, and map each part to an Olava section type (`SectionCatalog.cs`):

   | Supplied | Olava section |
   |---|---|
   | Names, parents, qualifications | `hero` (`partnerOneFamily`, `partnerOneDetails`…) |
   | Welcome letter | `welcome` |
   | Scratch card / date card | `save_the_date` |
   | Programme | `events` (from the Events tab) |
   | Venue + map | `venue` (Open in Maps link card, no embedded map) |
   | Dress code / travel / things to do | `dress_code` / `travel` / `explore` |
   | Story, gallery, Q&A, gifts, RSVP | `story`, `gallery`, `faq`, `registry`, `rsvp` |

   If something doesn't fit, add a field to an existing section or a new section type (backend `SectionContent.cs` + `SectionCatalog.cs`, frontend `SectionForm.tsx`, and every design). Never hard-code wording: **every text a guest sees must be editable**. Text elements are `{ text, hidden }`.
4. Drop what Olava does differently:
   - **Section menus:** removed by decision. Designs have no in-page navigation menu.
   - **Embedded maps:** use `MapCard` ("Open in Maps").
   - **localStorage RSVP and Formspree:** use `ctx.renderRsvpForm`.
   - **The template's own music code:** use `MusicButton` and `melodies.ts`.
   - **Google Fonts links:** fonts are self-hosted (see step 4).

## 2. Create the design folder

```
src/templates/designs/<design>/
  <Design>.tsx       renders every section type (switch on section.key); hero and footer placed explicitly
  Intro.tsx …        client components for interactive parts (openings, carousels, scratch cards)
  art.ts             generated SVG artwork (shared by themes; colours are CSS variables)
  css/design.css     the supplied style.css, scoped (step 3)
  css/theme-<template>.css   one per template: the supplied theme.css, scoped to [data-theme]
```

Rules:
- The root element is `<div className="olv-xx" data-theme={template} data-mode={ctx.mode}>`, with a short prefix (`eg` = enchanted garden).
- Wrap every element in `Editable` (`src/templates/Editable.tsx`) with a field name that matches the section form, so tapping it in the preview opens the right field.
  - Hidden or empty elements render nothing for guests and a faint placeholder in the editor.
- Use the shared pieces in `designs/shared/`:
  - `data.ts` (dates, venues, names);
  - `Countdown`, `AddToCalendar`, `MapCard`;
  - `MusicButton`, plus `announceInviteOpened()` when the opening animation finishes, which starts the music;
  - `Reveal` (scroll reveals), `DesignAssets` (stylesheets and fonts).
- **Edit mode** (`ctx.mode === "edit"`):
  - no opening animation;
  - no `position: fixed` (the preview sits inside the dashboard);
  - no autoplay;
  - links don't navigate (`SiteLink`).
- **Accessibility:**
  - one `<h1>` with the names;
  - the opening can be skipped by keyboard;
  - `prefers-reduced-motion` turns animations off;
  - decorative SVGs are `aria-hidden`;
  - contrast is AA (the axe tests check this).
- No `<main>` (the page provides it), no `dangerouslySetInnerHTML` with customer content (only our own generated SVG), and no third-party requests.
- **Breakpoints:** write width breakpoints as container queries on the design root (`.olv-xx { container: xx / inline-size }`, then `@container xx (min-width: 700px)`), not `@media`. In the editor the preview sits beside the panel and must lay out at its own width (Modern Indian does this).
- **Wording on the page comes from sections:** for example, hero buttons use the RSVP section's small label and the events heading, and a banner uses the countdown heading. If a design has fixed words with no section field, add a field (with a default) rather than hard-coding them.
- **Section numbers** ("01 —"): use a CSS counter, so they follow the sections actually shown.
- **Body classes** in the supplied files (`body.ready`, `body.locked`) become classes on an inner page wrapper, and the opening locks `<html>` itself.

### The RSVP form

Don't rebuild the supplied RSVP form. Render `<RsvpBlock ctx={ctx} labels={rsvpLabels(section.content)} />` (`src/templates/rsvp/`) inside an `Editable` with `field="labels"`. It shows:
- the real form on the live site;
- a try-it copy in the private preview and gallery, where nothing is sent;
- a look-only copy in the editor.

Theme it only through variables on the design's root element. Never style its inner elements from the design: a design's resets were what once squashed it. The variables are:

| Variable | What it sets |
|---|---|
| `--rsvp-ink`, `--rsvp-muted`, `--rsvp-error` | text, hints, errors |
| `--rsvp-input-bg`, `--rsvp-line`, `--rsvp-border-width`, `--rsvp-radius`, `--rsvp-selected-bg` | fields and answer cards |
| `--rsvp-accent`, `--rsvp-accent-hover`, `--rsvp-on-accent`, `--rsvp-accent-shadow`, `--rsvp-btn-radius`, `--rsvp-btn-font`, `--rsvp-btn-tracking`, `--rsvp-btn-size` | send button |
| `--rsvp-focus`, `--rsvp-focus-ring` | focus outline |
| `--rsvp-font`, `--rsvp-label-font`, `--rsvp-label-weight`, `--rsvp-label-tracking`, `--rsvp-choice-font` | type |
| `--rsvp-title-font`, `--rsvp-title-ink`, `--rsvp-title-size` | thank-you message |

A theme can go further with rules under `.olv-rsvp-root` (Light Minimal's, Heirloom's and Ivory Letterpress's ruled, underline-only fields, for example). The size checks in `e2e/templates.spec.ts` catch a squashed form.

### A design family with one template each (the Classic kit)

When several supplied designs differ in look but share structure (the Classic collection), don't write each from scratch. `src/templates/designs/classic/Classic.tsx` builds a design from a **kit**:

- `head`: the heading markup (wrapper and label classes, an ornament such as Black Tie's ◆ ◆ ◆, italic last word).
- `tone`: extra classes per section (light/dark bands, paper).
- `art`: the design's placeholder illustrations (ported from its `script.js`, colours as CSS variables).
- `Hero`, and `sections` overrides for what the design does its own way (Black Tie's event cards, Riviera's day tabs). Everything else uses the generic sections (`cl-*` classes, laid out by `classic/css/base.css`; the design's stylesheet dresses them).
- `Frame` to change every section's frame (Heirloom's chapters), `split` for a side-panel layout (English Garden), `introMs` and `Overlay` for the opening, `afterHero` for pieces under the hero (Riviera's bar).

The supplied opening (`body.intro` → `body.ready`) runs on the `.cl-page` wrapper (`classic/Entrance.tsx`); in the scoped CSS, change `.olv-xx.intro` to `.olv-xx .cl-page.intro`. A full-screen `::before` grain becomes `position: absolute`. With `tools/scope-css.mjs`, then remove the dropped features' rules (header, menus, the supplied form, map iframes) and turn width `@media` into `@container cl`. A design whose sections sit beside a panel makes its content column a container too (English Garden). Numbers that follow the sections shown use the `cl-sec` counter.

### A scroll-driven design (the Cinematic kit)

The 004 designs were one film-style design in five colourways, with a scroll engine (parallax, a pinned sideways story reel, an end-credits roll, a page tint per event). How it maps onto Olava (`src/templates/designs/cinematic/`):

- **Supplied sections → Olava sections.** Title card → the opening (`Opening.tsx`; its lines come from the hero eyebrow and tagline, and the hero's `openingNote` shows only when music is on). Prologue → welcome, story reel → story (pinned only with 2+ chapters), nights → events (five tones repeat), families → the hero's family lines (billed again in Wedding party), cast → wedding party, stills → gallery, setting → venue with Open in Maps cards, Q&A → FAQ, credits → footer (rows built from the wedding's data, labels editable).
- **State classes go on the inner wrapper.** The supplied `body.ready-to-open` / `body.is-entered` / `body.has-cursor` become classes on `.ci-page`; in the editor the wrapper gets `ready-to-open is-entered` at once, so everything shows in its final state.
- **Pinned (`position: sticky`) parts** need no scrolling ancestor: the root uses `overflow-x: clip`, never `hidden`.
- **`Engine.tsx`** runs only on the site (not in the editor) and does nothing that moves under reduced motion; the prologue is then lit in full.
- **Removed by decision:** the custom cursor's words (a soft ring remains, mouse only), the hero video, the map iframe, the supplied RSVP form and its browser-only storage, per-night RSVP and the dietary question.
- **Contrast:** two light colourways used a muted grey and the accent for small text below WCAG AA; they set a deeper `--haze` and an `--accent-ink` (small text and the RSVP button) while `--accent` keeps the supplied colour for lines and artwork.

### Fields every design should show

- **Dress code swatches:** each dress-code item can have up to 5 colours (`colors`, `#rrggbb`). Render them with `designs/shared/Swatches.tsx` (or the design's own swatch markup, as Cinematic does).
- **Events:** `labels.time` and `labels.place` ("Time", "Place") for designs that label those lines.
- **Footer:** `starringLabel`, `withLabel`, `featuringLabel`, `locationLabel` for designs with a credits roll.

## 3. Scope the CSS

Supplied stylesheets target `body`, `:root` and bare classes. Scope them so they can't leak into the dashboard or into each other:

```bash
node tools/scope-css.mjs --scope .olv-eg --prefix eg path/to/style.css > src/templates/designs/enchanted-garden/css/design.css
node tools/scope-css.mjs --scope .olv-eg --prefix eg --theme sage-garden path/to/theme.css > .../css/theme-sage-garden.css
```

Then review the result by hand:
- remove styles for removed features (menus, music UI);
- make `position: fixed` parts work in edit mode;
- check that `vh` units behave inside the editor preview.

## 4. Fonts

List each template's fonts (families, weights, italics) in `src/templates/designs/fonts.json`. Add the `@fontsource/<family>` package as a dev dependency: fonts are copied at build time, so guests' browsers never contact Google.

`npm run designs` (runs automatically before `dev` and `build`) does three things:
- builds `public/designs/` (minified CSS, per-template font CSS and files, with content hashes);
- writes `src/templates/designs/assets.generated.ts`;
- the generated files are git-ignored; only the manifest is committed.

## 5. Register the design (web app)

1. `src/templates/designs/registry.ts`: add `"<design>": <Design>`.
2. `src/templates/designs/available.ts`: add the key to `DESIGN_KEYS`. A unit test keeps the two lists equal.

   Templates whose design isn't registered are hidden from the gallery and the template picker. Existing websites on them fall back to the simple built-in layout. So the catalogue can list templates before the design ships.
3. Sample content for the gallery's live preview: `src/templates/sample.ts`, if the design shows something new.
4. **Layouts and wording** (`src/templates/designs/shared/layouts.ts`): add the design to `DESIGN_NATIVE`, naming its own gallery, events and FAQ style, and the shared layout each already matches (`same`), so the editor doesn't offer it twice. In the design's Gallery, Events and FAQ sections, call `chosenLayout(section, …, "<design>")`: when it returns a layout, draw the shared `PhotoGallery`, `EventList` or `FaqList` (in `shared/`) instead of the design's own markup. They take the design's colours and fonts from its `--rsvp-*` variables. If the design shows event wording only some designs have, update `eventLabelFields`, so the editor offers exactly the fields guests will see.
5. **Event covers and captions:** show an event's `cover` on its card when there is one; the card must look complete without one. Galleries open photos full screen with the caption (the shared `PhotoViewer` does this).

## 6. Add the templates to the catalogue (API)

In `src/Olava.Infrastructure/Persistence/Seed/CatalogSeed.cs`:
- Add a `Starters` entry for the design: the sections a new website starts with, in order.
- Add one `T(...)` line per template:
  - key, name, description, category, tier code and sort order;
  - design key, five main colours (background, surface, accent, text, muted), heading and body fonts;
  - `Music` for designs with an opening and background music (Premium only, by decision).

The seed only **inserts** missing templates and versions, so prices and versions in the database are never overwritten.
- To change a published template's definition, add a new version rather than editing the old one.
- To **remove** templates, add `old-key → replacement-key` to `CatalogSeed.Replaced`. Pick a replacement in the same tier, so nobody gets a more expensive design for free. On start-up, `TemplateCatalogUpgrader` moves existing weddings and live sites to the replacement, then deletes the old rows. This is irreversible: back up the database first.

## 7. Thumbnails

With the API and the web app running:

```bash
node tools/capture-thumbnails.mjs --base http://localhost:3000 [--only key1,key2]
```

This captures each template's opened invitation into `public/designs/thumbs/` and updates `thumbs.generated.ts`. Commit both. Re-run after visual changes.

## 8. Check it

- **Visual:** compare with the supplied `index.html` at 390 px and at desktop width, theme by theme (screenshots side by side). Check the opening, every section, empty states (no photos, no venue, no events), long names, and the editor preview.
- **Tests:**
  - Backend: catalogue entries and tiers (`CatalogueAndMusicTests`).
  - Unit: the design renders every starter section, hidden lines stay private, edit placeholders appear (`tests/components/Designs.test.tsx`).
  - Browser: add the template keys to `e2e/templates.spec.ts` (opens, every section, music button, no console errors) and to `e2e/a11y.spec.ts` (axe and 320 px).
- `npm run lint`, `npx tsc --noEmit`, `npm test`, `npx playwright test`, `dotnet test`.
