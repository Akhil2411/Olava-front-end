import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { openInvite, register, simulatePayment, skipSetupToEvents } from "./helpers";

const photo = (n: number) => path.join(__dirname, `photo${n}.jpg`);

// Mobile-first editor: tap-to-edit in a bottom sheet, sections screen, custom blocks, draft vs live.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function saved(page: Page) {
  await expect(page.getByRole("status").getByText("Saved to your draft").first()).toBeVisible({ timeout: 15_000 });
}

/** Drags a sortable handle past another row with real touch events (a finger on a phone). */
async function drag(page: Page, handle: Locator, target: Locator) {
  const from = (await handle.boundingBox())!;
  const to = (await target.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = from.x + from.width / 2;
  const y0 = from.y + from.height / 2;
  const y1 = to.y < from.y ? to.y - 6 : to.y + to.height + 6;   // just past the target's far edge
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
  await page.waitForTimeout(300);                               // long-press to pick up (prevents accidental drags while scrolling)
  for (let i = 1; i <= 15; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / 15 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

test("edit every element, manage sections and build a custom section on a phone", async ({ page, browser }) => {
  test.setTimeout(180_000);
  await register(page, "Meera Pillai");
  await page.getByLabel("Partner one").fill("Meera");
  await page.getByLabel("Partner two").fill("Rahul");
  await page.getByLabel("Wedding date").fill("2027-03-20");
  await skipSetupToEvents(page, "warm-earthy");
  const weddingId = page.url().match(/weddings\/([0-9a-f-]+)\//)![1];
  const base = `/dashboard/weddings/${weddingId}`;
  await page.getByRole("button", { name: "+ Add event" }).click();
  await page.getByLabel("Event name").fill("Wedding ceremony");
  await page.getByLabel("Starts").fill("2027-03-20T10:00");
  await page.getByRole("button", { name: "Add event", exact: true }).click();
  await page.getByRole("dialog", { name: "No venue selected" }).getByRole("button", { name: "Continue without venue" }).click();
  await expect(page.getByRole("heading", { name: "Wedding ceremony" })).toBeVisible();

  // Pay and publish first, so we can prove later edits stay in the draft until republish.
  await page.goto(`${base}/publish`);
  await page.getByRole("button", { name: /Pay & unlock publishing/ }).click();
  await expect(page.getByText("Payment not completed")).toBeVisible();
  await simulatePayment("captured");
  await page.reload();
  await page.getByRole("button", { name: "Publish website" }).click();
  await expect(page.getByText("Your website is live!")).toBeVisible();
  const publicUrl = (await page.getByRole("link", { name: /\/w\// }).first().getAttribute("href"))!;

  // 1. Tap the welcome note's heading in the live preview → bottom sheet; edit it and hide the small label.
  await page.goto(`${base}/design`);
  await page.locator("#welcome [data-edit-field=heading]").click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toHaveAccessibleName("Welcome note");
  await sheet.getByLabel(/^Heading/).fill("How we met");
  await sheet.getByRole("switch", { name: "Show small label" }).click();
  await sheet.getByLabel(/^Your letter/).fill("At a friend's wedding in Thrissur.");
  await saved(page);
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(page.locator("#welcome").getByRole("heading", { name: "How we met" })).toBeVisible();
  await expect(page.locator("#welcome").getByText("Small label hidden · tap to show")).toBeVisible();

  // Parents' line and the second line under a name: optional, tap the placeholder to add.
  await page.locator("[data-edit-field=partnerOneFamily]").click();
  await expect(sheet).toHaveAccessibleName("Welcome");
  await sheet.getByLabel(/^Meera's family line/).fill("Daughter of Mr. & Mrs. Pillai");
  await sheet.getByLabel(/^Meera's second line/).fill("MBBS · Paediatrician");
  await saved(page);
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(page.locator("#olv-eg-hero").getByText("Daughter of Mr. & Mrs. Pillai")).toBeVisible();

  // Fixed wording is editable too (Venue "Open in Maps" → custom label).
  await page.locator("#venue [data-edit-field=heading]").click();
  await sheet.getByLabel("Map link wording").fill("Find the venue");
  await saved(page);
  await sheet.getByRole("button", { name: "Done" }).click();

  // 2. Sections screen: delete Countdown (with confirmation), add a custom section.
  await page.getByRole("button", { name: "☰ Sections" }).click();
  await sheet.getByRole("button", { name: /^Delete Countdown/ }).click();
  await page.getByRole("dialog", { name: /Delete/ }).getByRole("button", { name: "Delete section" }).click();
  await expect(sheet.getByRole("button", { name: /^Countdown/ })).toHaveCount(0);
  await sheet.getByRole("button", { name: "＋ Add section" }).click();
  await sheet.getByRole("button", { name: /Custom section/ }).click();
  await expect(sheet).toHaveAccessibleName("Custom section");

  // 3. Build the custom section with every block type.
  await sheet.getByLabel(/^Title/).fill("Our ceremony");
  const addBlock = async (name: RegExp) => {
    await sheet.getByRole("button", { name: "＋ Add block" }).click();
    await sheet.getByRole("button", { name }).click();
  };
  await addBlock(/^Heading A short title/);
  await sheet.getByRole("textbox", { name: "Heading", exact: true }).last().fill("The rituals");
  await addBlock(/^Text A paragraph/);
  await sheet.getByRole("textbox", { name: "Text", exact: true }).last().fill("Haldi in the morning, pheras at noon.");
  await addBlock(/^Photo One photo/);
  await sheet.locator("input[type=file]").last().setInputFiles(photo(1));
  await expect(sheet.getByRole("button", { name: "Change" })).toBeVisible({ timeout: 30_000 });
  await sheet.getByLabel("Description for screen readers").last().fill("Haldi ceremony");
  await addBlock(/^Video Upload one/);
  await sheet.getByRole("radio", { name: "YouTube or Vimeo link" }).click(); // new video blocks start on "Upload a video"
  await sheet.getByLabel("YouTube or Vimeo link").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await sheet.getByLabel("Title (for screen readers)").fill("Our pre-wedding film");
  await addBlock(/^Button A link/);
  await sheet.getByLabel("Button text").fill("Email us");
  await sheet.getByRole("textbox", { name: "Link", exact: true }).last().fill("mailto:meera@example.com");
  await addBlock(/^Divider/);
  await addBlock(/^Map A place/);
  await sheet.getByLabel("Place name").fill("Bolgatty Palace");
  await sheet.getByLabel(/^Address/).fill("Mulavukad, Kochi");
  await saved(page);

  // Reorder blocks: arrows, then drag.
  await sheet.getByRole("button", { name: "Move Heading: The rituals down" }).click();
  await expect(sheet.locator("[data-field^='blocks.']").first()).toContainText("Text: Haldi");
  await sheet.getByRole("button", { name: "Move Heading: The rituals up" }).click();
  await expect(sheet.locator("[data-field^='blocks.']").first()).toContainText("Heading: The rituals");
  await saved(page);
  await sheet.getByRole("button", { name: "Done" }).click();

  const custom = page.locator("section", { has: page.getByRole("heading", { name: "Our ceremony" }) });
  await expect(custom.locator("iframe")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
  await expect(custom.getByText("Bolgatty Palace", { exact: true })).toBeVisible();

  // 4. Reorder sections on the Sections screen: drag (pointer) and arrows; hide the gallery section.
  await page.getByRole("button", { name: "☰ Sections" }).click();
  const customHandle = sheet.getByRole("button", { name: "Drag to reorder Custom section, Our ceremony" });
  const rsvpHandle = sheet.getByRole("button", { name: /^Drag to reorder RSVP/ });
  await customHandle.scrollIntoViewIfNeeded();
  await drag(page, customHandle, rsvpHandle);
  const rowNames = () => sheet.getByRole("button", { name: /^Drag to reorder / }).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  await expect.poll(async () => { const n = await rowNames(); return n.indexOf("Drag to reorder Custom section, Our ceremony") < n.findIndex((x) => x!.startsWith("Drag to reorder RSVP")); }).toBe(true);
  for (let i = 0; i < 5; i++) {
    await sheet.getByRole("button", { name: /^Move Custom section, Our ceremony up$/ }).click();
    await saved(page);
  }
  await sheet.getByRole("switch", { name: "Show Gallery on the website" }).click();
  await saved(page);
  await sheet.getByRole("button", { name: "Done" }).click();

  // Accessibility of the editor itself (WCAG 2.1 AA; the template preview is checked on its own pages).
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("[aria-label='Live preview']").analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")} ${v.nodes[0]?.failureSummary}`)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

  // 5. Draft only: the live site hasn't changed…
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(publicUrl);
  await expect(guest.getByRole("heading", { name: "Our ceremony" })).toHaveCount(0);
  await expect(guest.getByRole("heading", { name: "How we met" })).toHaveCount(0);

  // …until republished.
  await page.goto(`${base}/publish`);
  await page.getByRole("button", { name: "Republish changes" }).click();
  await expect(page.getByText("Republished")).toBeVisible();
  await guest.goto(publicUrl);
  await openInvite(guest);
  await expect(guest.getByRole("heading", { name: "How we met" })).toBeVisible();
  await expect(guest.locator("#welcome").getByText("Welcome", { exact: true })).toHaveCount(0); // hidden label not published
  await expect(guest.getByText("Daughter of Mr. & Mrs. Pillai")).toBeVisible();
  await expect(guest.getByRole("link", { name: /Find the venue/ })).toHaveCount(0);       // (no venue on this event)
  const live = guest.locator("section", { has: guest.getByRole("heading", { name: "Our ceremony" }) });
  await expect(live.getByRole("heading", { name: "The rituals" })).toBeVisible();
  await expect(live.getByRole("img", { name: "Haldi ceremony" })).toBeVisible();
  await expect(live.locator("iframe[title='Our pre-wedding film']")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  await expect(live.getByRole("link", { name: "Email us" })).toHaveAttribute("href", "mailto:meera@example.com");
  await expect(live.getByRole("link", { name: /Open in Maps/ })).toHaveAttribute("href", /google\.com\/maps\/search/);
  await expect(guest.locator("#countdown")).toHaveCount(0);                                // deleted section
  const order = await guest.locator("main section[id], main header[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(order.indexOf("section")).toBeLessThan(order.indexOf("events"));                  // moved up
  expect(order).not.toContain("gallery");
});
