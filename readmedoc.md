# A beginner's tour of the Olava frontend

This guide is for someone new to Next.js. It walks through the **real files** in this repository in the order you'd meet them when following one request, so you can find your way around and make your first change safely.

> Before you start: get the app running with [`Readme.md`](Readme.md). Keep `npm run dev` open while you read. Every save reloads the page, so you can see the effect of a change straight away.

---

## Step 1: Learn the four kinds of file

Next.js decides what a file does from its **name and location** under `src/app/`.

| File name | What it is | Example in this repo |
|---|---|---|
| `page.tsx` | A page. Its folder path is its URL | `src/app/(marketing)/templates/page.tsx` → `/templates` |
| `layout.tsx` | A frame around all pages below it (header, navigation) | `src/app/dashboard/layout.tsx` |
| `route.ts` | A URL that returns data or a file instead of a page | `src/app/api/weddings/[weddingId]/qr/route.ts` |
| `error.tsx`, `not-found.tsx` | What to show when something goes wrong | `src/app/dashboard/error.tsx` |

Two folder conventions:
- `[id]` in a folder name is a **variable**. `dashboard/weddings/[id]/details` matches `/dashboard/weddings/0193…/details`, and the page receives `id`.
- `(marketing)` and `(auth)` in **brackets** are just groups for organising. They don't appear in the URL.

## Step 2: Server code vs browser code

This is the most important idea in the project.

- **By default, every component runs on the server.** It can read cookies and call the API, and its code is never sent to the browser.
- A file that starts with **`"use client"`** also runs in the browser. Use it only when you need interactivity (`useState`, click handlers). Example: `src/features/weddings/components/DetailsForm.tsx`.
- A file that starts with **`"use server"`** contains **Server Actions**: functions the browser can trigger (usually by submitting a form) but which run on the server. Example: `src/features/weddings/actions.ts`.
- Files with `import "server-only"` at the top (e.g. `src/lib/api/server.ts`) **fail the build** if a browser component imports them. That is how we make sure the API address and tokens can never leak.

## Step 3: Follow one page from start to finish

Open these files side by side and follow the **Wedding details** page.

1. **`src/proxy.ts`** runs first for every request.
   - It refreshes the sign-in if it's about to expire.
   - It redirects to `/login` if you open `/dashboard/...` while signed out.
2. **`src/app/dashboard/layout.tsx`, then `src/app/dashboard/weddings/[id]/layout.tsx`**: the frames. The second one loads the wedding and shows the section navigation (`src/components/dashboard/WeddingNav.tsx`).
3. **`src/app/dashboard/weddings/[id]/details/page.tsx`**: the page itself.
   ```tsx
   export default async function DetailsPage({ params }: PageProps<"/dashboard/weddings/[id]/details">) {
     const { id } = await params;          // the [id] from the URL
     const wedding = await getWedding(id); // load data on the server
     return <Card>…<DetailsForm wedding={wedding} … /></Card>;
   }
   ```
4. **`src/features/weddings/data.ts`**, where `getWedding` lives. It calls `api()` and then `unwrap()`:
   - `api()` (in `src/lib/api/server.ts`) calls the .NET API and attaches the sign-in token from the cookie.
   - `unwrap()` (in `src/lib/api/loaders.ts`) turns failures into the right screen: signed out → login page, not yours or missing → "not found" page, anything else → `error.tsx`.
5. **`src/features/weddings/components/DetailsForm.tsx`**, the form (a `"use client"` component).
   ```tsx
   const [state, action] = useActionState(updateWeddingAction.bind(null, wedding.id), idle);
   return <form action={action}> … <TextField name="title" errors={state.fieldErrors?.title} /> … </form>;
   ```
   Submitting the form calls `updateWeddingAction` on the server. `state` holds the result: field errors, or a success message.
6. **`src/features/weddings/actions.ts`**: `updateWeddingAction`.
   - Checks the input with **zod** (a schema describing valid values).
   - Sends `PUT /api/v1/weddings/{id}` through `api()`.
   - If the API rejects it (e.g. "that web address is taken"), turns the API's error into a message under the right field (`fromProblem` in `src/lib/forms.ts`).
   - On success, calls `revalidateWedding()` so every dashboard page shows the new data.

Every other dashboard page works the same way: **page → data.ts → form component → actions.ts → API**.

## Step 4: How a wedding website is drawn

- **`src/templates/SiteRenderer.tsx`** takes a `SiteModel` from the API (couple, theme, sections) and draws each section in order. The components live in `src/templates/sections/`:
  - `Hero.tsx`: the top of the site;
  - `Basic.tsx`: countdown, story, events, gallery, RSVP, FAQ, travel, contact, wedding party, registry and footer;
  - `Custom.tsx`: sections the host builds from blocks.
- **The same renderer is used in four places:**
  - `src/app/template-sample/[key]/page.tsx`: a template with sample data (`src/templates/sample.ts`);
  - `src/app/preview/[id]/page.tsx`: your private draft;
  - `src/app/w/[slug]/page.tsx`: the **public** website, built from the published copy only;
  - the **editor's live preview** (Step 4b).
- **Content is data, not code.** Each section's text lives in its content as `{ text, hidden }`, for example the small "OUR STORY" label is `content.eyebrow`. Read it with the helpers in `src/templates/content.ts` (`textEl`, `visible`, `label`); they never trust the data's shape.
- **`<Editable>`** (`src/templates/Editable.tsx`) wraps every text and photo:
  - On the website it shows the element only if it isn't hidden or empty.
  - In the editor it makes the element tappable and shows a dashed placeholder for hidden ones.
- **`src/templates/theme.ts`** turns the template's colours and fonts into CSS variables (`--s-accent`, `--s-heading`…). The section components use those variables, so one component works for every template.
- **Want to change how the Events section looks?** Edit `Events` in `src/templates/sections/Basic.tsx`. It updates the sample, the preview, the editor and live sites together.

## Step 4b: How the editor works (Design tab)

Open `src/app/dashboard/weddings/[id]/design/page.tsx`. It loads the wedding, its sections, photos and the draft preview on the server, then hands them to **`src/features/editor/SiteEditor.tsx`**, a `"use client"` component.

1. **The preview is the real renderer.** `SiteEditor` draws `<SiteRenderer mode="edit" …>`. Your unsaved edits are mixed into the server's preview by `withDraftSections` (`src/templates/draft.ts`), so you see changes as you type.
2. **Tapping an element** calls `onSelect({ sectionId, field })`. The editor opens that section's form:
   - on a phone in a bottom sheet (`src/components/ui/BottomSheet.tsx`);
   - on a computer in the side panel.

   The form scrolls to the field you tapped (`FieldFrame` in `src/features/editor/fields.tsx`).
3. **The forms** are in `src/features/editor/SectionForm.tsx`, one `case` per section type. Custom-section blocks are in `BlocksEditor.tsx`.
4. **Saving** is automatic (`src/features/editor/useSections.ts`):
   - each change waits 0.7 seconds, then calls the Server Action `updateSectionAction`;
   - the action sends the section with its `revision` number;
   - if someone changed the section in another tab, the API says "conflict" and the editor loads the newer version instead of overwriting it.
5. **Reordering** uses `SortableList.tsx`: a drag handle (works with a finger, a mouse or the keyboard) plus ↑/↓ buttons.

## Step 5: Files, images and QR codes

- The browser can't call the API directly, because it has no token. Images, the CSV export and QR codes are fetched by small **Route Handlers** that pass the file through:
  - `src/app/api/media/[weddingId]/[mediaId]/[variant]/route.ts`: draft images (needs sign-in);
  - `src/app/api/public/sites/[slug]/media/[token]/[variant]/route.ts`: images on a live site (no sign-in);
  - `src/app/api/weddings/[weddingId]/guests/export/route.ts` and `…/qr/route.ts`.
- They all use the helper `relay()` in `src/lib/api/relay.ts`.

## Step 6: Where styles live

- **Tailwind classes** go directly on elements: `className="rounded-2xl bg-blush p-5"`.
- **Brand colours and fonts** (`pink`, `pink-dark`, `blush`, `ink`, `mute`…) are defined once in `src/app/globals.css` under `@theme`.
- **Reusable pieces** live in `src/components/ui/` (`Button`, `TextField`, `Alert`, `Card`, `Modal`…). Use these rather than styling a new button from scratch, so the app stays consistent and accessible.

## Step 7: Make your first change (practice)

Goal: add a hint under the **Website title** field.

1. Open `src/features/weddings/components/DetailsForm.tsx`.
2. Find `<TextField label="Website title" … hint="Shown in browser tabs and link previews." …/>`.
3. Change the `hint` text and save. The page at `/dashboard/weddings/<id>/details` updates.
4. Run the checks before committing:
   ```powershell
   npm run lint
   npm run typecheck
   npm test
   ```

## Step 8: Where to look when…

| You want to… | Look in |
|---|---|
| Add a dashboard page | `src/app/dashboard/weddings/[id]/<name>/page.tsx`, then add it to `src/components/dashboard/WeddingNav.tsx` |
| Call a new API endpoint | Add the types to `src/lib/api/types.ts`; reads go in `features/<area>/data.ts`, changes go in `features/<area>/actions.ts` |
| Show an API error nicely | `src/lib/api/problem.ts` (each error has a `code`, e.g. `wedding.slug_taken`) |
| Change sign-in behaviour | `src/proxy.ts`, `src/lib/session/`, `src/features/auth/` |
| Change the public RSVP form | `src/features/public/RsvpForm.tsx` (its wording comes from the RSVP section's `labels`) and `src/features/public/actions.ts` |
| Add a new kind of section | Backend first (`SectionContent.cs` + `SectionCatalog.cs`), then a component in `src/templates/sections/`, a `case` in `SiteRenderer.tsx` and in `SectionForm.tsx` |
| Change the editor | `src/features/editor/` (start with `SiteEditor.tsx`) |
| Change payment UI | `src/features/billing/components/CheckoutButton.tsx` (the amount always comes from the API) |
| Add a test | `tests/components/*.test.tsx` (Vitest), or `e2e/*.spec.ts` (Playwright; `editor.spec.ts` runs at phone size) |

## Common mistakes

- **"PageProps is not defined" in the editor.** Run `npm run typecheck` (or `npm run dev`) once. Next.js generates these types.
- **Importing `@/lib/api/server` into a `"use client"` file.** The build fails on purpose. Move the call into a Server Action and call that instead.
- **Trusting the frontend for security.** Hiding a button isn't protection. The API checks ownership, payment and validation on every call. Frontend checks only give users faster feedback.
- **Rendering HTML from user input.** Never use `dangerouslySetInnerHTML` for customer content. Text is shown as text.
