import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { openInvite, register, skipSetupToEvents } from "./helpers";

const ENCHANTED = ["sage-garden", "soft-pastel", "warm-earthy", "light-minimal", "bold-modern", "dark-luxury"];
const MODERN_INDIAN = ["rani-gold", "marigold-ink", "pink-city", "pista-rose", "midnight-mehfil", "monsoon-mono"];
/** Classic (Standard): five designs, one template each (layout key = template key). No music. */
const CLASSIC = ["black-tie", "english-garden", "heirloom", "ivory-letterpress", "riviera"];
/** Cinematic (Premium): one design, five colourways (folder 004). */
const CINEMATIC = ["noor", "royal-gold", "emerald-maharani", "rose-dusk", "midnight-sapphire"];
/** Each design's starter sections, as shown on its sample page: in the usual order, RSVP last. */
const SECTIONS: Record<string, string[]> = {
  "enchanted-garden": ["countdown", "welcome", "save-the-date", "events", "venue", "dress-code", "travel", "rsvp"],
  "modern-indian": ["countdown", "story", "events", "venue", "dress-code", "travel", "gallery", "faq", "rsvp"],
  // Classic: English Garden, Heirloom, Ivory Letterpress and Riviera show the countdown inside the hero.
  "black-tie": ["countdown", "story", "events", "dress-code", "travel", "gallery", "faq", "rsvp"],
  "english-garden": ["welcome", "story", "wedding-party", "events", "travel", "registry", "faq", "rsvp"],
  heirloom: ["story", "events", "travel", "registry", "rsvp"],
  "ivory-letterpress": ["countdown", "story", "wedding-party", "events", "travel", "registry", "rsvp"],
  riviera: ["welcome", "events", "travel", "explore", "gallery", "faq", "rsvp"],
  // Cinematic shows the countdown in the hero too.
  cinematic: ["countdown", "welcome", "story", "wedding-party", "events", "venue", "dress-code", "travel", "gallery", "faq", "rsvp"],
};
const DESIGNS: [string, string[]][] = [["enchanted-garden", ENCHANTED], ["modern-indian", MODERN_INDIAN], ...CLASSIC.map((k) => [k, [k]] as [string, string[]]), ["cinematic", CINEMATIC]];
const PREMIUM = new Set(["enchanted-garden", "modern-indian", "cinematic"]);

test("template gallery: grouped by category, filters in the address, real thumbnails and live preview", async ({ page }) => {
  await page.goto("/templates");
  const group = page.getByRole("region", { name: "Enchanted Garden" });
  await expect(group.getByRole("listitem")).toHaveCount(ENCHANTED.length);
  await expect(page.getByRole("region", { name: "Modern Indian" }).getByRole("listitem")).toHaveCount(MODERN_INDIAN.length);
  await expect(page.getByRole("region", { name: "Classic" }).getByRole("listitem")).toHaveCount(CLASSIC.length);
  await expect(page.getByRole("region", { name: "Cinematic" }).getByRole("listitem")).toHaveCount(CINEMATIC.length);
  for (const name of ["Blush Garden", "Ivory Gold", "Royal Maroon"]) await expect(page.getByText(name)).toHaveCount(0); // trial templates gone
  // Thumbnails are real captures of each design (lazy-loaded, so fetched directly here).
  const thumbs = await page.locator("main img[src*='/designs/thumbs/']").evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).getAttribute("src")!));
  expect(thumbs).toHaveLength(ENCHANTED.length + MODERN_INDIAN.length + CLASSIC.length + CINEMATIC.length);
  for (const src of thumbs) {
    const res = await page.request.get(src);
    expect(res.status(), src).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/jpeg");
  }

  // A filtered view is shareable; unknown values fall back to everything.
  await page.goto("/templates?type=enchanted-garden");
  await expect(group.getByRole("listitem")).toHaveCount(ENCHANTED.length);
  await expect(page.getByRole("button", { name: "Enchanted Garden", pressed: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Modern Indian" })).toHaveCount(0);   // filtered out
  await page.getByRole("button", { name: "Modern Indian" }).click();
  await expect(page).toHaveURL(/\/templates\?type=modern-indian$/);
  await expect(page.getByRole("region", { name: "Modern Indian" }).getByRole("listitem")).toHaveCount(MODERN_INDIAN.length);
  await expect(page.getByRole("region", { name: "Enchanted Garden" })).toHaveCount(0);
  await page.getByRole("button", { name: "All types" }).click();
  await expect(page).toHaveURL(/\/templates$/);
  // Type and price combine: Classic templates are Standard, the other two types Premium.
  await page.goto("/templates?type=classic&price=standard");
  await expect(page.getByRole("region", { name: "Classic" }).getByRole("listitem")).toHaveCount(CLASSIC.length);
  await expect(page.getByRole("button", { name: "Classic", pressed: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Standard ·/, pressed: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Enchanted Garden" })).toHaveCount(0);
  await page.getByRole("button", { name: /^Premium ·/ }).click();
  await expect(page).toHaveURL(/\/templates\?type=classic&price=premium$/);
  await expect(page.getByText("No templates match these filters.")).toBeVisible();
  await page.getByRole("button", { name: "Show all templates" }).click();
  await expect(page).toHaveURL(/\/templates$/);
  await page.goto("/templates?price=premium");
  await expect(page.getByRole("region", { name: "Classic" })).toHaveCount(0);
  await expect(group.getByRole("listitem")).toHaveCount(ENCHANTED.length);
  await expect(page.getByRole("region", { name: "Modern Indian" }).getByRole("listitem")).toHaveCount(MODERN_INDIAN.length);
  await expect(page.getByRole("region", { name: "Cinematic" }).getByRole("listitem")).toHaveCount(CINEMATIC.length);
  await page.goto("/templates?type=cinematic&price=premium");
  await expect(page.getByRole("region", { name: "Cinematic" }).getByRole("listitem")).toHaveCount(CINEMATIC.length);
  await expect(page.getByRole("region", { name: "Classic" })).toHaveCount(0);
  await page.goto("/templates?type=nope&price=nope");
  await expect(group.getByRole("listitem")).toHaveCount(ENCHANTED.length);

  // Live preview opens the design at phone width.
  await group.getByRole("button", { name: /Live preview.*Sage Garden/ }).click();
  const frame = page.frameLocator("iframe[title='Sage Garden preview']");
  await expect(frame.getByRole("button", { name: "Tap to open" })).toBeVisible();
});

for (const [design, keys] of DESIGNS) for (const key of keys) {
  test(`${key}: opens, shows every section${PREMIUM.has(design) ? " and the music button" : ""}, with no errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/template-sample/${key}`);
    await openInvite(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Zayn");
    for (const id of SECTIONS[design]) await expect(page.locator(`#${id}[data-section]`)).toBeAttached();
    // In the usual order, RSVP last before the footer.
    const order = await page.locator("[data-section]").evaluateAll((els) => els.map((e) => e.id));
    expect(order.filter((id) => SECTIONS[design].includes(id))).toEqual(SECTIONS[design]);
    await expect(page.locator("nav")).toHaveCount(0); // no section menu (removed by decision)
    await expect(page.locator("iframe")).toHaveCount(0); // no embedded maps
    if (SECTIONS[design].includes("venue")) await expect(page.getByRole("link", { name: /Open in Maps/ }).first()).toHaveAttribute("href", /google\.com\/maps/);
    // The RSVP form keeps proper spacing in every theme (a design's CSS reset once squashed it).
    const rsvp = page.locator("section#rsvp form");
    const name = rsvp.getByLabel("Your name");
    const nameBox = (await name.boundingBox())!;
    const labelBox = (await rsvp.getByText("Your name", { exact: true }).boundingBox())!;
    expect(nameBox.height).toBeGreaterThanOrEqual(48);
    expect(nameBox.y - (labelBox.y + labelBox.height)).toBeGreaterThanOrEqual(6);
    expect((await rsvp.locator(".olv-rsvp-choice").first().boundingBox())!.height).toBeGreaterThanOrEqual(52);
    expect((await rsvp.getByRole("button", { name: "Send RSVP" }).boundingBox())!.height).toBeGreaterThanOrEqual(50);
    if (!PREMIUM.has(design)) {
      await expect(page.getByRole("button", { name: /(Play|Pause) music/ })).toHaveCount(0); // music is Premium only
      expect(errors).toEqual([]);
      return;
    }
    // Music button: fixed in its corner while scrolling.
    const music = page.getByRole("button", { name: /(Play|Pause) music/ });
    const before = await music.boundingBox();
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(300);
    expect((await music.boundingBox())!.y).toBeCloseTo(before!.y, 0);
    expect(errors).toEqual([]);
  });
}

test("music settings in the editor: icon, colour, corner, own track with rights confirmation, turn off", async ({ page }) => {
  test.setTimeout(120_000);
  await register(page, "Music Tester");
  await page.getByLabel("Partner one").fill("Asha");
  await page.getByLabel("Partner two").fill("Dev");
  await skipSetupToEvents(page, "bold-modern");
  const id = page.url().match(/weddings\/([0-9a-f-]+)\//)![1];
  await page.goto(`/dashboard/weddings/${id}/design`);
  await page.getByRole("button", { name: "🎵 Music" }).click();
  const preview = page.getByRole("region", { name: "Live preview" });

  await page.getByRole("radio", { name: "Bell" }).click();
  await page.getByRole("radio", { name: "Top right" }).click();
  await page.getByRole("radio", { name: "Colour #111111" }).click();
  const button = preview.getByRole("button", { name: "Play music" });
  await expect(button).toHaveCSS("background-color", "rgb(17, 17, 17)");
  await expect(preview.locator(".olv-music")).toHaveAttribute("data-position", "top-right");

  // Own track: the upload needs the rights confirmation.
  const mp3 = path.join(test.info().outputDir, "song.mp3");
  fs.mkdirSync(path.dirname(mp3), { recursive: true });
  fs.writeFileSync(mp3, Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(4096)]));
  await page.locator("input[type=file][accept*=audio]").setInputFiles(mp3);
  await expect(page.getByText(/song\.mp3 · 0\.0 MB/)).toBeVisible();
  const upload = page.getByRole("button", { name: "Upload", exact: true });
  await expect(upload).toBeDisabled();
  await page.getByLabel(/I confirm that I own this music/).check();
  await upload.click();
  await expect(page.getByRole("radio", { name: /Your own music/ })).toBeChecked({ timeout: 15_000 });

  // Survives a reload (saved), then music can be turned off entirely.
  await page.reload();
  await page.getByRole("button", { name: "🎵 Music" }).click();
  await expect(page.getByRole("radio", { name: "Bell" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("switch", { name: "Play music on your website" }).click();
  await expect(preview.getByRole("button", { name: /music/ })).toHaveCount(0);
  await page.goto(`/preview/${id}`);
  await openInvite(page);
  await expect(page.getByRole("button", { name: /(Play|Pause) music/ })).toHaveCount(0);
});

test("RSVP: the editor shows the real form (look-only, tap opens the settings); the preview lets you try it without sending", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1366, height: 900 });
  await register(page, "Form Tester");
  await page.getByLabel("Partner one").fill("Lila");
  await page.getByLabel("Partner two").fill("Omar");
  await skipSetupToEvents(page, "dark-luxury");
  const id = page.url().match(/weddings\/([0-9a-f-]+)\//)![1];
  await page.goto(`/dashboard/weddings/${id}/design`);

  const form = page.locator("#rsvp form");
  await expect(form.locator("input[name=fullName]")).toBeAttached();
  await expect(form).toHaveAttribute("inert", "");
  await expect(page.getByText("Preview: guests can reply once your website is published.")).toBeVisible();
  await page.locator("#rsvp [data-edit-field=labels]").click();
  await expect(page.getByRole("complementary", { name: "Editor" }).getByRole("heading", { name: "RSVP" })).toBeVisible();

  // Settings show up in the preview form straight away.
  await page.getByRole("switch", { name: "Allow “Not sure yet”" }).click();
  await expect(form.getByText("Not sure yet")).toHaveCount(0);

  // Private preview: the real form, nothing reaches the guest list.
  await page.goto(`/preview/${id}`);
  await openInvite(page);
  const live = page.locator("#rsvp form");
  await live.getByLabel("Your name").fill("Preview Guest");
  await live.getByText("Joyfully accept").click();
  await live.getByRole("button", { name: "Send RSVP" }).click();
  await expect(page.locator("#rsvp").getByRole("status")).toContainText("This is a preview, so your reply wasn't sent.");
  await page.goto(`/dashboard/weddings/${id}/guests`);
  await expect(page.getByText("Preview Guest")).toHaveCount(0);
});
