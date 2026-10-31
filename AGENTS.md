<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Olava frontend: project rules

Read [`Readme01.md`](Readme01.md) for the architecture and [`docs/phase1-checklist.md`](docs/phase1-checklist.md) for what is done. The API contract is in `../Olava-back-end/docs/backend-api-changes.md`.

## Next.js 16 specifics used here

- **Middleware is `src/proxy.ts`** (exported `proxy` function, Node runtime). Don't create `middleware.ts`.
- **`params` and `searchParams` are Promises.** Type pages with the generated global helpers `PageProps<"/route">`, `LayoutProps<"/route">` and `RouteContext<"/route">`. They exist after `next typegen` (`npm run typecheck` runs it).
- **Cache Components is OFF on purpose.** API reads are `cache: "no-store"`, with one exception: the public template catalogue (`getTemplates`, `revalidate: 300`, anonymous only). Don't add `"use cache"`, `cacheComponents` or other `fetch` caching without a design discussion: pages depend on the session, and unpublishing must take effect immediately.
- **Client router cache:** `staleTimes` is `{ dynamic: 30, static: 60 }`. Every mutation must stay a Server Action that calls `revalidateWedding()`, which clears it. The editor's autosave calls `syncDraftAction` after a pause and when leaving.
- **No `loading.tsx` under `dashboard/weddings/[id]`.** React holds Suspense content back for at least 300 ms after a fallback appears, which made fast tab switches 4× slower. Navigation feedback comes from `useLinkStatus`: `<TrackNavigation/>` inside links (built into `LinkButton` and the section tabs) drives the loader in `SectionContent`.
- **Tailwind v4** is compiled through `@tailwindcss/turbopack` (see `next.config.ts`). Tokens live in `src/app/globals.css` `@theme`.
- **Fonts** come from `@fontsource` packages, not `next/font/google`.

## Rules

1. **Only the server talks to the API.**
   - Use `api()`/`apiRaw()` from `src/lib/api/server.ts` (server-only). Browser code must never call the API directly or see tokens.
   - Don't add `NEXT_PUBLIC_` variables for secrets or for the API URL.
2. **Reads and writes:**
   - Reads go in `features/<area>/data.ts` (`import "server-only"`, `unwrap()` for page data).
   - Mutations are Server Actions in `features/<area>/actions.ts`. They validate with zod, call the API, and then call `revalidateWedding()`. Validate route ids with `isId`/`assertId`.
3. **The API is the authority** for ownership, prices, payment state, publishing and validation. Frontend checks are UX only. Never compute a price or "paid" state in the frontend.
4. **Public routes** (`/w/[slug]`, `/q/[code]`, `/api/public/**`, `/template-sample/**`):
   - Use only public API endpoints (`auth: false`).
   - Never render guest data or internal ids.
   - Keep `noindex` on wedding sites.
5. **User content is text.** No `dangerouslySetInnerHTML` with customer data. Theme values must pass `src/templates/theme.ts` validation.
6. **One renderer.** Site visuals live in `src/templates/`. Preview, sample, public pages and the editor's live preview must keep using `SiteRenderer`.
   - Every visible text or image goes through `<Editable>` (`src/templates/Editable.tsx`). It hides the element on the site when hidden or empty and makes it tappable in the editor.
   - Links go through `<SiteLink>`, so they don't navigate inside the editor.
   - Read content with the helpers in `src/templates/content.ts`. Never trust its shape, and only render `safeHref`/`videoEmbedUrl` outputs as URLs.
   - `src/templates/draft.ts` mirrors the API's preview transform (`mediaId` → `ref`). Keep the two in sync.
7. **Errors:** map API problems via `src/lib/api/problem.ts` and keep showing the API's message. Branch on `problem.code`, never on the message text.
8. **Editor (`src/features/editor/`):**
   - Sections autosave one at a time through `useSections` (debounced, sends `revision`, adopts the latest version on `section.conflict`).
   - `draftIssue()` holds back saves the API would reject. Add a check there when you add required fields.
   - Reordering uses `SortableList` (dnd-kit drag handle plus arrow buttons). Keep both.
   - Dialogs inside dialogs: `Modal`/`BottomSheet` only react to their own close/cancel events.
9. **Accessibility:**
   - Use the `components/ui` primitives (labelled fields, `aria-describedby` errors, `<dialog>` modals).
   - Keep WCAG AA contrast.
   - `e2e/a11y.spec.ts` must stay green.
10. **No out-of-scope features** (AI, generated video invitations, WhatsApp Business API, agency tools, custom domains). Embedding a host's own YouTube/Vimeo link in a custom section is in scope. Don't invent prices, policies or legal copy; mark placeholders.
11. **Designs** (`src/templates/designs/<design>/`): follow `docs/adding-templates.md`.
    - Register a new design in both `registry.ts` and `available.ts`.
    - Scope supplied CSS with `tools/scope-css.mjs`.
    - Fonts are self-hosted via `fonts.json` and `@fontsource` (never Google Fonts links).
    - No section menus, no embedded maps, no third-party requests.
    - Every text a guest sees goes through `<Editable>`.
    - The RSVP form is shared (`src/templates/rsvp/`): render `<RsvpBlock>` and theme it with `--rsvp-*` variables only. It shows the real form in every mode (live, try-it in previews, look-only in the editor).
    - `public/designs/` (except `thumbs/`) and the font files are generated: never edit them by hand.
12. **Secrets:** `.env.local` is git-ignored; `.env.example` holds names only.

## Before you finish

```powershell
npm run lint; npm run typecheck; npm test; npm run build
```

If you touched a user flow, run the Playwright journey too (`Readme01.md` → End-to-end tests). Update `docs/phase1-checklist.md` with the change and its evidence.
