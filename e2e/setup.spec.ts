import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { openInvite, register, simulatePayment } from "./helpers";

// 2026-10-23/26 features: the first-login walkthrough (design step, story moments, event cards), sample content,
// the "no venue" warning, the Video section and finding the editor afterwards.

const file = (name: string) => path.join(__dirname, name);
const stepLabel = (page: Page) => page.getByText(/^Step \d+ of \d+$/);

/** Step 1 is filled in: on to the design step, pick `template`, then on to "choose sections". Returns the wedding id. */
async function toSections(page: Page, template: string) {
  await page.getByRole("button", { name: "Next: choose your design" }).click();
  await page.waitForURL(/step=design/);
  const id = page.url().match(/setup\/([0-9a-f-]+)/)![1];
  await page.locator(`[data-template-key="${template}"]`).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForURL(/step=sections/);
  return id;
}

test("walkthrough: design with live preview, sections, story moments, several events, Back, Skip, resume, finish and what's next", async ({ page }) => {
  test.setTimeout(240_000);
  await register(page, "Walk Through");

  // Step 1: the two of you (no template here any more).
  await expect(stepLabel(page)).toHaveText("Step 1 of 8");
  await expect(page.getByLabel("Template")).toHaveCount(0);
  await page.getByLabel("Partner one").fill("Asha");
  await page.getByLabel("Partner two").fill("Ravi");
  await page.getByLabel("Wedding date").fill("2027-02-14");
  await page.getByRole("button", { name: "Next: choose your design" }).click();

  // Step 2: choose a design: picture cards, filters, "Decide later" selected until a design is chosen, live preview with their names.
  await page.waitForURL(/\/dashboard\/setup\/[0-9a-f-]+\?step=design/);
  const id = page.url().match(/setup\/([0-9a-f-]+)/)![1];
  const base = `/dashboard/weddings/${id}`;
  await expect(stepLabel(page)).toHaveText("Step 2 of 8");
  await expect(page.getByRole("radio", { name: /Decide later/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-template-key] img").first()).toBeVisible(); // thumbnails
  await page.getByRole("button", { name: /Live preview\s*:\s*Sage Garden/ }).click();
  const previewWindow = page.getByRole("dialog", { name: "Sage Garden preview" });
  await expect(previewWindow.frameLocator("iframe").getByText(/Asha/).first()).toBeVisible({ timeout: 30_000 });
  await previewWindow.getByRole("button", { name: "Choose this design" }).click();
  await expect(page.locator('[data-template-key="sage-garden"]')).toHaveAttribute("aria-checked", "true");
  // The choice shows in the step bar pinned to the bottom of the screen, with Next, without scrolling down.
  const bar = page.getByRole("group", { name: "Step navigation" });
  await expect(bar.getByText(/Selected: Sage Garden/).first()).toBeVisible();
  const barBox = (await bar.boundingBox())!;
  expect(barBox.y + barBox.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await expect(bar.getByRole("button", { name: "Next", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 3: choose sections. Pre-ticked: story, events (locked), countdown, gallery, RSVP.
  await page.waitForURL(/step=sections/);
  await expect(stepLabel(page)).toHaveText("Step 3 of 8");
  for (const name of ["Our story", "Countdown", "Gallery", "RSVP"]) await expect(page.getByRole("checkbox", { name: new RegExp(name) })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Events/ })).toBeDisabled();
  await page.getByRole("checkbox", { name: /Gallery/ }).uncheck();
  await page.getByRole("checkbox", { name: /Dress code/ }).check();
  await page.getByRole("checkbox", { name: /Video/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // couple, design, sections, story, events, rsvp, dress code, video, done = 9.
  // Story: one moment to start, add more, reorder, remove an empty one without a question.
  await page.waitForURL(/step=story/);
  await expect(stepLabel(page)).toHaveText("Step 4 of 9");
  await page.getByLabel("Your story").fill("We met on the rainiest day of the year.");
  await expect(page.getByRole("group", { name: /^Moment/ })).toHaveCount(1);
  const moment = (n: number) => page.getByRole("group", { name: `Moment ${n}` });
  await moment(1).getByLabel("Title").fill("The first hello");
  await page.getByRole("button", { name: "+ Add a moment" }).click();
  await moment(2).getByLabel("Title").fill("The proposal");
  await page.getByRole("button", { name: "+ Add a moment" }).click();
  await expect(page.getByRole("group", { name: /^Moment/ })).toHaveCount(3);
  await page.getByRole("button", { name: "Move moment 2 up" }).click();
  await expect(moment(1).getByLabel("Title")).toHaveValue("The proposal");
  await page.getByRole("button", { name: "Remove moment 3" }).click(); // empty: removed at once
  await expect(page.getByRole("group", { name: /^Moment/ })).toHaveCount(2);
  await page.getByRole("button", { name: "Remove moment 2" }).click(); // filled: asks first
  await page.getByRole("dialog", { name: "Remove this moment?" }).getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("group", { name: /^Moment/ })).toHaveCount(2);
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Events: open cards, suggestions, add another without saving, one question for the events without a venue.
  await page.waitForURL(/step=events/);
  await expect(stepLabel(page)).toHaveText("Step 5 of 9");
  const card = (n: number) => page.getByRole("group").filter({ has: page.getByLabel("Event name") }).nth(n);
  await expect(card(0).getByLabel("Date")).toHaveValue("2027-02-14"); // starts on the wedding date
  await page.getByRole("button", { name: "+ Sangeet" }).click();       // fills the empty first card
  await expect(card(0).getByLabel("Event name")).toHaveValue("Sangeet");
  await expect(card(0).getByLabel("Type")).toHaveValue("Sangeet");
  await card(0).getByLabel("Date").fill("2027-02-13");
  await card(0).getByLabel("Starts").fill("19:00");
  await page.getByRole("button", { name: "+ Wedding" }).click();       // a new card, ready to fill
  await expect(card(1).getByLabel("Event name")).toHaveValue("Wedding");
  await expect(card(1).getByLabel("Type")).toHaveValue("Wedding");
  await expect(card(1).getByLabel("Type").locator("option", { hasText: "Madhuramvekkal" })).toHaveCount(1);
  await card(1).getByLabel("Starts").fill("10:30");
  await page.getByRole("button", { name: "+ Add another event" }).click();
  await card(2).getByLabel("Event name").fill("Reception");            // no time yet
  await page.getByRole("button", { name: "Add another event" }).click(); // a 4th, left empty: ignored
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(card(2).getByText("Choose the start time.")).toBeVisible();
  await page.getByRole("button", { name: /^Delete\s*Reception$/ }).click();
  await page.getByRole("dialog", { name: "Delete Reception?" }).getByRole("button", { name: "Delete event" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const warning = page.getByRole("dialog", { name: "No venue selected" });
  await expect(warning).toContainText("Sangeet and Wedding have no venue. They will appear on your website without a location. Do you want to continue anyway?");
  await expect(warning).toContainText("You haven't added any venues yet.");
  await warning.getByRole("button", { name: "Go back" }).click();
  await expect(warning).toBeHidden();

  // A venue for the wedding, through "+ New venue" (with the map-link help; Escape closes only the tip). It's selected on that card.
  await page.getByRole("button", { name: /\+ New venue\s*for Wedding/ }).click();
  await page.getByRole("button", { name: "How do I get a map link?" }).click();
  await expect(page.getByText(/tap Share, then Copy link/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText(/tap Share, then Copy link/)).toBeHidden();
  await page.getByLabel("Venue name").fill("St. Mary's Church");
  await page.getByRole("dialog", { name: "Add venue" }).getByRole("button", { name: "Add venue", exact: true }).click();
  await expect(card(1).getByLabel("Venue", { exact: true })).toHaveValue(/[0-9a-f-]{36}/);
  await expect(card(0).getByLabel("Venue", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(warning).toContainText("Sangeet has no venue. It will appear on your website without a location.");
  await warning.getByRole("button", { name: "Continue without venue" }).click();
  await page.waitForURL(/step=rsvp/);

  // Back: the events were saved (the empty card wasn't), and the story kept its moments in their new order.
  await page.getByRole("button", { name: "← Back" }).click();
  await page.waitForURL(/step=events/);
  await expect(page.getByRole("group").filter({ has: page.getByLabel("Event name") })).toHaveCount(2);
  await expect(card(0).getByLabel("Event name")).toHaveValue("Sangeet");
  await expect(card(1).getByLabel("Event name")).toHaveValue("Wedding");
  await page.getByRole("button", { name: "← Back" }).click();
  await page.waitForURL(/step=story/);
  await expect(page.getByLabel("Your story")).toHaveValue("We met on the rainiest day of the year.");
  await expect(moment(1).getByLabel("Title")).toHaveValue("The proposal");
  await expect(moment(2).getByLabel("Title")).toHaveValue("The first hello");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForURL(/step=events/);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await warning.getByRole("button", { name: "Continue without venue" }).click(); // asked again for the reloaded list

  // RSVP, then skip out; the dashboard offers to resume.
  await page.waitForURL(/step=rsvp/);
  await expect(stepLabel(page)).toHaveText("Step 6 of 9");
  await page.getByRole("button", { name: "Skip this for now" }).click();
  await page.waitForURL(new RegExp(`${base}\\?setup=skipped`));
  const resume = page.getByRole("region", { name: "Finish setting up" });
  await expect(resume).toContainText("Step 6 of 9");
  await resume.getByRole("link", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Replies from guests" })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.waitForURL(/step=dress_code/);
  await page.getByLabel("Title").first().fill("Kasavu and pastels");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Video: the title is required; a valid MP4 uploads with a preview.
  await page.waitForURL(/step=video/);
  await expect(stepLabel(page)).toHaveText("Step 8 of 9");
  await page.getByLabel("Title").fill("");
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText("Give the video a title.")).toBeVisible();
  await page.getByLabel("Title").fill("Our first dance");
  await page.locator("input[type=file][accept*=video]").setInputFiles(file("tiny.mp4"));
  await expect(page.getByLabel("Preview of your video")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Finish" }).click();
  await page.waitForURL(/step=done/);
  await expect(page.getByRole("heading", { name: "Your website is taking shape" })).toBeVisible();
  await expect(page.getByText("One thing left: choose a design")).toHaveCount(0);

  // What's next: where to edit and where to change the template.
  await expect(page.getByRole("link", { name: "Open the editor" })).toHaveAttribute("href", `${base}/design`);
  await expect(page.getByRole("link", { name: "Change template" })).toHaveAttribute("href", `${base}/design?panel=template`);

  // The site follows the answers.
  await page.goto(`/preview/${id}`);
  await expect(page.locator("#gallery")).toHaveCount(0);
  for (const text of ["Kasavu and pastels", "Our first dance", "We met on the rainiest day of the year.", "The proposal", "The first hello", "Sangeet", "St. Mary's Church"])
    await expect(page.getByText(text).first()).toBeVisible();
  await expect(page.getByText("Reception")).toHaveCount(0);
  const order = await page.evaluate(() => { const t = document.body.innerText; return [t.indexOf("The proposal"), t.indexOf("The first hello")]; });
  expect(order[0]).toBeLessThan(order[1]);
  // The full-screen preview links to the editor.
  await expect(page.getByRole("link", { name: "Change template" })).toHaveAttribute("href", `${base}/design?panel=template`);

  // "Change template" opens the editor with the Template panel; the editing tip shows once.
  await page.goto(`${base}/design?panel=template`);
  await expect(page.getByRole("region", { name: "This is where you edit your website" })).toBeVisible();
  await expect(page.getByText("Switch any time: your details, events, photos and guests stay as they are.")).toBeVisible();
  await page.getByRole("button", { name: "Got it" }).click();
  await page.reload();
  await expect(page.getByRole("region", { name: "This is where you edit your website" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Wedding sections" }).getByRole("link", { name: "Edit & design", exact: true })).toBeVisible();
  // Far down the preview, "↑" brings you back to the top.
  const topButton = page.getByRole("button", { name: "Back to the top of the page" });
  await page.mouse.wheel(0, 4000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(600);
  await topButton.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);

  // The dashboard preview offers the same two ways on.
  await page.goto(`${base}/preview`);
  await expect(page.getByRole("link", { name: "✎ Edit this website" })).toHaveAttribute("href", `${base}/design`);
  await expect(page.getByRole("link", { name: "🎨 Change template" })).toHaveAttribute("href", `${base}/design?panel=template`);

  await page.goto(base);
  await expect(page.getByRole("region", { name: "Finish setting up" })).toHaveCount(0);
});

test("decide later: the walkthrough goes on without a design, then a design chosen later keeps the chosen sections in order", async ({ page }) => {
  test.setTimeout(180_000);
  await register(page, "Later Decider");
  await page.getByLabel("Partner one").fill("Meera");
  await page.getByLabel("Partner two").fill("Joel");
  await page.getByRole("button", { name: "Next: choose your design" }).click();
  await page.waitForURL(/step=design/);
  const id = page.url().match(/setup\/([0-9a-f-]+)/)![1];
  const base = `/dashboard/weddings/${id}`;
  await page.getByRole("button", { name: "Next", exact: true }).click(); // "Decide later" is selected
  await page.waitForURL(/step=sections/);
  await page.getByRole("checkbox", { name: /Gallery/ }).uncheck();
  await page.getByRole("checkbox", { name: /FAQ/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForURL(/step=story/);
  await page.getByLabel("Your story").fill("Two families, one long table.");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForURL(/step=events/);

  await page.goto(`/dashboard/setup/${id}?step=done`);
  const left = page.getByRole("alert").or(page.getByRole("status")).filter({ hasText: "One thing left: choose a design" });
  await expect(left).toBeVisible();
  await left.getByRole("link", { name: "Choose a design" }).click();
  await page.waitForURL(`**${base}/design`);
  await expect(page.getByText("Choose a design to see your website")).toBeVisible();
  await page.getByRole("listitem").filter({ has: page.getByRole("button", { name: /Use this\s*:\s*Black Tie/ }) }).hover(); // the card's actions show on hover
  await page.getByRole("button", { name: /Use this\s*:\s*Black Tie/ }).click();
  await expect(page.getByRole("region", { name: "Live preview" })).toBeVisible({ timeout: 30_000 });

  await page.goto(`/preview/${id}`);
  await expect(page.getByText("Two families, one long table.")).toBeVisible();
  await expect(page.locator("#gallery")).toHaveCount(0);
  await expect(page.locator("#faq")).toHaveCount(1);
  const ids = await page.locator("section[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(ids.indexOf("story")).toBeLessThan(ids.indexOf("faq")); // chosen order kept
  // The welcome banner (names) is still at the top, above the chosen sections.
  const top = await page.evaluate(() => {
    const y = (el: Element | null) => (el ? el.getBoundingClientRect().top + scrollY : NaN);
    return { names: y(document.querySelector("h1")), story: y(document.querySelector("#story")) };
  });
  expect(top.names).toBeLessThan(top.story);
});

test("samples: empty sections show marked samples in the editor and preview, never on the live site, and go away with real content", async ({ page }) => {
  test.setTimeout(240_000);
  await register(page, "Sample Seer");
  await page.getByLabel("Partner one").fill("Lila");
  await page.getByLabel("Partner two").fill("Omar");
  await page.getByLabel("Wedding date").fill("2027-03-01"); // needed to publish
  const id = await toSections(page, "sage-garden");
  const base = `/dashboard/weddings/${id}`;
  await page.getByRole("checkbox", { name: /FAQ/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForURL(/step=story/);
  await page.getByRole("button", { name: "Skip this for now" }).click();
  await page.waitForURL(/setup=skipped/);

  // Editor: sample tags on the empty sections, a badge in the Sections list.
  await page.goto(`${base}/design`);
  const preview = page.getByRole("region", { name: "Live preview" });
  await expect(preview.locator("#faq [data-olava-sample]")).toBeVisible();
  await expect(preview.locator("#faq")).toContainText("Can I bring a plus-one?");
  await expect(preview.locator("#events [data-olava-sample]")).toBeVisible();
  await expect(preview.locator("#faq [data-olava-sample]")).toContainText("Sample hidden on your live site until you add your own");
  await page.getByRole("button", { name: "☰ Sections" }).click();
  await expect(page.getByText("Showing sample content: hidden on your live site until you add your own").first()).toBeVisible();

  // Private preview: the same samples.
  await page.goto(`/preview/${id}`);
  await expect(page.locator("#faq [data-olava-sample]")).toBeVisible();

  // Publish page lists them (with links into the editor) without blocking anything.
  await page.goto(`${base}/publish`);
  await expect(page.getByText("Some sections still show sample content")).toBeVisible();
  await expect(page.getByRole("link", { name: "FAQ", exact: true })).toHaveAttribute("href", new RegExp(`${base}/design\\?section=`));
  await expect(page.getByRole("button", { name: /Pay & unlock publishing/ })).toBeEnabled(); // samples never block

  // Real content replaces the sample: an event, and an FAQ answered in the walkthrough form.
  await page.goto(`${base}/events`);
  await page.getByRole("button", { name: "+ Add venue" }).click();
  await page.getByLabel("Venue name").fill("Bagh Garden");
  await page.getByRole("dialog").getByRole("button", { name: "Add venue", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "+ Add event" }).click();
  await page.getByLabel("Event name").fill("Nikah");
  await page.getByLabel("Starts").fill("2027-03-01T11:00");
  await expect(page.getByLabel("Venue")).toHaveValue(/[0-9a-f-]{36}/); // the only venue is preselected
  await page.getByRole("dialog").getByRole("button", { name: "Add event" }).click();
  await expect(page.getByRole("dialog", { name: "No venue selected" })).toHaveCount(0); // a venue was chosen: no warning
  await expect(page.getByText("Nikah")).toBeVisible();
  await page.goto(`/dashboard/setup/${id}?step=faq`);
  await page.getByLabel("Question", { exact: true }).first().fill("Is there parking?");
  await page.getByLabel("Answer").first().fill("Yes, at the hotel.");
  // A common question: tap to add it, then type the answer (the sample answer is only a hint).
  await page.locator("[data-faq-presets]").getByRole("button", { name: /Is there a dress code\?/ }).click();
  await expect(page.locator("[data-faq-presets]").getByRole("button", { name: /Is there a dress code\?/ })).toHaveCount(0);
  await expect(page.getByLabel("Answer").last()).toHaveAttribute("placeholder", /^e\.g\. /);
  await page.getByLabel("Answer").last().fill("Kerala traditional.");
  await page.getByRole("button", { name: /Next|Finish/ }).click();
  await page.waitForURL(/step=(?!faq)/);

  await page.goto(`/preview/${id}`);
  await expect(page.locator("#faq")).toContainText("Is there parking?");
  await expect(page.locator("#faq")).toContainText("Is there a dress code?");
  await expect(page.locator("#faq [data-olava-sample]")).toHaveCount(0);
  await expect(page.locator("#faq")).not.toContainText("Can I bring a plus-one?");
  await expect(page.locator("#events [data-olava-sample]")).toHaveCount(0);
  await expect(page.locator("#events")).toContainText("Nikah");

  // Live site: no samples at all; the still-empty sections (e.g. wedding party) are simply absent.
  await page.goto(`${base}/publish`);
  await page.getByRole("button", { name: /Pay & unlock publishing/ }).click();
  await expect(page.getByText("Payment not completed")).toBeVisible();
  await simulatePayment("captured");
  await page.reload();
  await page.getByRole("button", { name: "Publish website" }).click();
  await expect(page.getByText("Your website is live!")).toBeVisible();
  const live = await page.getByRole("link", { name: /\/w\// }).first().getAttribute("href");
  await page.goto(live!);
  await openInvite(page);
  await expect(page.locator("#faq")).toContainText("Is there parking?");
  await expect(page.locator("#faq")).toContainText("Is there a dress code?");
  await expect(page.locator("[data-olava-sample]")).toHaveCount(0);
  await expect(page.getByText("Hidden on your live site", { exact: false })).toHaveCount(0);
  await expect(page.locator("#story")).toHaveCount(0); // empty on the live site → left out
});

test("video: browser and server checks, Replace/Remove, inline playback on the live site that pauses the music", async ({ page, browser }) => {
  test.setTimeout(240_000);
  await register(page, "Video Maker");
  await page.getByLabel("Partner one").fill("Noor");
  await page.getByLabel("Partner two").fill("Kabir");
  await page.getByLabel("Wedding date").fill("2027-03-01"); // needed to publish
  const id = await toSections(page, "rani-gold");
  const base = `/dashboard/weddings/${id}`;
  await page.getByRole("checkbox", { name: /Video/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.goto(`/dashboard/setup/${id}?step=video`);
  await page.getByLabel("Title").fill("Our story on film");
  const input = page.locator("input[type=file][accept*=video]");

  // Browser-side checks (nothing is uploaded).
  await input.setInputFiles({ name: "wedding.mp4", mimeType: "video/mp4", buffer: Buffer.alloc(30 * 1024 * 1024 + 1) });
  await expect(page.getByText("This video is larger than 30 MB. Please choose a smaller file.")).toBeVisible();
  await input.setInputFiles({ name: "clip.mov", mimeType: "video/quicktime", buffer: Buffer.from("not really a video") });
  await expect(page.getByText(/QuickTime \(\.mov\)/)).toBeVisible();
  await input.setInputFiles({ name: "clip.avi", mimeType: "video/x-msvideo", buffer: Buffer.from("x") });
  await expect(page.getByText(/Upload an MP4 or WebM video/)).toBeVisible();

  // Server-side checks, straight to the upload route (as if the browser check were bypassed).
  const post = (name: string, mimeType: string, buffer: Buffer) => page.request.post(`/api/weddings/${id}/videos`, {
    headers: { Origin: new URL(page.url()).origin }, multipart: { file: { name, mimeType, buffer } },
  });
  const jpegAsMp4 = await post("photo.mp4", "video/mp4", readFileSync(file("photo1.jpg")));
  expect(jpegAsMp4.status()).toBe(400);
  expect((await jpegAsMp4.json()).detail).toMatch(/MP4 or WebM/);
  const hevc = await post("phone.mp4", "video/mp4", readFileSync(file("tiny-hevc.mp4")));
  expect(hevc.status()).toBe(400);
  expect((await hevc.json()).detail).toMatch(/HEVC/);
  const tooBig = await post("big.mp4", "video/mp4", Buffer.concat([readFileSync(file("tiny.mp4")), Buffer.alloc(30 * 1024 * 1024)]));
  expect(tooBig.status()).toBe(400); // just over 30 MB: the API's own size check
  expect((await tooBig.json()).detail).toBe("This video is larger than 30 MB. Please choose a smaller file.");
  const wayTooBig = await post("huge.mp4", "video/mp4", Buffer.alloc(33 * 1024 * 1024));
  expect(wayTooBig.status()).toBe(413); // over the request limit: refused before it's read
  expect((await wayTooBig.json()).detail).toBe("This video is larger than 30 MB. Please choose a smaller file.");

  // Upload (with progress), Replace, Remove, upload again.
  await input.setInputFiles(file("tiny.mp4"));
  await expect(page.getByLabel("Preview of your video")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/· MP4$/)).toBeVisible();
  await page.getByRole("button", { name: "Replace video" }).click(); // opens the picker; choose the WebM instead
  await input.setInputFiles(file("clip-sound.webm"));
  await expect(page.getByText(/· WebM$/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Remove" }).click();
  await page.getByRole("dialog", { name: "Remove this video?" }).getByRole("button", { name: "Remove video" }).click();
  await expect(page.getByLabel("Preview of your video")).toHaveCount(0);
  await input.setInputFiles(file("clip-sound.webm"));
  await expect(page.getByText(/· WebM$/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /Next|Finish/ }).click();
  await page.waitForURL(/step=(?!video)/);

  // An event without a venue (publishing needs an event): the warning, "Continue without venue", the list badge.
  await page.goto(`${base}/events`);
  await page.getByRole("button", { name: "+ Add event" }).click();
  await page.getByLabel("Event name").fill("Haldi");
  await page.getByLabel("Starts").fill("2027-03-19T09:00");
  await page.getByRole("dialog").getByRole("button", { name: "Add event" }).click();
  await page.getByRole("dialog", { name: "No venue selected" }).getByRole("button", { name: "Continue without venue" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("No venue", { exact: true })).toBeVisible();

  // Publish, then watch it on the live site.
  await page.goto(`${base}/publish`);
  await page.getByRole("button", { name: /Pay & unlock publishing/ }).click();
  await expect(page.getByText("Payment not completed")).toBeVisible();
  await simulatePayment("captured");
  await page.reload();
  await page.getByRole("button", { name: "Publish website" }).click();
  await expect(page.getByText("Your website is live!")).toBeVisible();
  const live = await page.getByRole("link", { name: /\/w\// }).first().getAttribute("href");

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const guest = await phone.newPage();
  await guest.goto(live!);
  await openInvite(guest);
  const video = guest.locator("#video video");
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("playsinline", "");
  expect(await video.evaluate((v: HTMLVideoElement) => v.autoplay)).toBe(false);
  await expect(guest.locator("#video")).toContainText("Our story on film");
  const box = (await video.boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(390); // fits a phone
  // The description was left empty: no empty paragraph for it.
  expect(await guest.locator("#video .olv-video-desc").count()).toBe(0);

  // The event without a venue: a clean card, no empty location line, no venue section, no map link.
  const events = guest.locator("#events");
  await expect(events).toContainText("Haldi");
  await expect(events).not.toContainText(/Open in maps|Venue|undefined|null/i);
  expect(await events.evaluate((el) => [...el.querySelectorAll("p, span, div, address")]
    .filter((n) => n.children.length === 0 && !n.textContent!.trim() && n.getBoundingClientRect().height > 2 && !n.getAttribute("aria-hidden")).map((n) => n.className))).toEqual([]);
  await expect(guest.locator("#venue")).toHaveCount(0);

  // Music on, then the video plays with sound: the music pauses, and comes back when the video pauses.
  const music = guest.getByRole("button", { name: /(Play|Pause) music/ });
  await expect(music).toBeVisible();
  if ((await music.getAttribute("aria-label"))?.startsWith("Play") || (await music.textContent())?.includes("Play")) await music.click(); // the opening may already have started it
  await expect(guest.getByRole("button", { name: "Pause music" })).toBeVisible();
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(async (v: HTMLVideoElement) => { v.muted = false; v.volume = 1; await v.play(); });
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime > 0 && !v.paused)).toBe(true);
  await expect(guest.getByRole("button", { name: "Play music" })).toBeVisible(); // music paused itself
  await video.evaluate((v: HTMLVideoElement) => v.pause());
  await expect(guest.getByRole("button", { name: "Pause music" })).toBeVisible(); // and resumed
  // Starting the music again while the video plays pauses the video.
  await video.evaluate(async (v: HTMLVideoElement) => { await v.play(); });
  await expect(guest.getByRole("button", { name: "Play music" })).toBeVisible();
  await guest.getByRole("button", { name: "Play music" }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await phone.close();
});
