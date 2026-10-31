import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { register, simulatePayment, openInvite, skipSetupToEvents } from "./helpers";

const photo = (n: number) => path.join(__dirname, `photo${n}.jpg`);

test("full Phase 1 customer journey", async ({ page, browser, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  // 1–2. Register, create a project (private draft, no purchase needed)
  await register(page, "Priya Nair");
  await page.getByLabel("Partner one").fill("Priya");
  await page.getByLabel("Partner two").fill("Arjun");
  await page.getByLabel("Wedding date").fill("2027-02-14");
  await skipSetupToEvents(page, "sage-garden");
  const weddingId = page.url().match(/weddings\/([0-9a-f-]+)\//)![1];
  const base = `/dashboard/weddings/${weddingId}`;
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();

  // 4. Events & venue
  await page.getByRole("button", { name: "+ Add venue" }).click();
  await page.getByLabel("Venue name").fill("The Garden Palace");
  await page.getByLabel("City").fill("Kochi");
  await page.getByRole("button", { name: "Add venue", exact: true }).click();
  await expect(page.getByText("The Garden Palace").first()).toBeVisible();
  await page.getByRole("button", { name: "+ Add event" }).click();
  await page.getByLabel("Event name").fill("Wedding ceremony");
  await page.getByLabel("Starts").fill("2027-02-14T16:30");
  await page.getByLabel("Venue").selectOption({ label: "The Garden Palace" });
  await page.getByLabel("Dress code").fill("Pastels");
  await page.getByRole("button", { name: "Add event", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wedding ceremony" })).toBeVisible();

  // 3 & 5. Design (desktop editor): switch template, tap the welcome note in the live preview to edit it, hide the registry (autosaved)
  await page.goto(`${base}/design`);
  await page.getByRole("button", { name: "🎨 Template" }).click();
  // Live preview shows the saved draft in the other template (nothing applied yet), then "Use this template" applies it.
  // The card's buttons show on hover/tap; keyboard users tab straight to them, as here.
  await page.getByRole("button", { name: /Live preview\s*: Soft Pastel/ }).press("Enter");
  const draftInTemplate = page.frameLocator("iframe[title='Soft Pastel preview']");
  await expect(draftInTemplate.getByText("Private preview in Soft Pastel: not applied yet")).toBeVisible();
  await expect(draftInTemplate.locator("[data-theme='soft-pastel']")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Use this template" }).click();
  // The editor reloads with the new design; wait for it before editing (as a couple would see it change).
  await expect(page.locator("[aria-label='Live preview'] [data-theme='soft-pastel']")).toBeVisible();
  await page.locator("#welcome [data-edit-field=body]").click();
  await page.getByLabel("Your letter").fill("We met at college in Kochi.");
  await expect(page.locator("#welcome").getByText("We met at college in Kochi.")).toBeVisible(); // live preview
  await expect(page.getByRole("status").getByText("Saved to your draft").first()).toBeVisible();
  await page.getByRole("button", { name: "← All sections" }).click();
  await page.getByRole("switch", { name: "Show Gift registry on the website" }).click();
  await expect(page.locator("#registry")).toHaveCount(0);
  await expect(page.getByRole("status").getByText("Saved to your draft").first()).toBeVisible();
  const editorAxe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("[aria-label='Live preview']").analyze();
  expect(editorAxe.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")} ${v.nodes[0]?.failureSummary}`)).toEqual([]);

  // 9. Gallery: upload, caption, reorder, remove
  await page.goto(`${base}/gallery`);
  await page.locator("#gallery-upload").setInputFiles([photo(1), photo(2)]);
  await expect(page.getByRole("img", { name: /Gallery photo 2/ })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Caption for photo 1").fill("Our first trip");
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByRole("img", { name: "Our first trip" })).toBeVisible();
  await page.getByRole("button", { name: "Move Our first trip right" }).click();
  await expect(page.getByLabel("Caption for photo 2")).toHaveValue("Our first trip");
  await page.getByRole("button", { name: "Remove" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("1 of 100 photos")).toBeVisible();

  // 6. Preview before payment (private, real template + data)
  await page.goto(`/preview/${weddingId}`);
  await expect(page.getByText("Private preview: not visible to guests")).toBeVisible();
  await expect(page.getByText("We met at college in Kochi.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wedding ceremony" })).toBeVisible();
  await page.goto(`${base}/preview`);
  await page.getByRole("button", { name: /Desktop/ }).click();
  // The site renders at a real laptop size inside a device frame, scaled to fit.
  await expect(page.locator('[data-device="desktop"] iframe[title="Website preview"]')).toBeVisible();
  await expect(page.locator("[data-size-note]")).toContainText("1440 × 900");

  // 7–8. Guests: add, CSV with errors (nothing imported), valid CSV (check → import), export
  await page.goto(`${base}/guests`);
  await page.getByRole("button", { name: "+ Add guest" }).click();
  await page.getByLabel("Full name").fill("Asha Menon");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await expect(page.getByText("Asha Menon")).toBeVisible();

  await page.getByRole("button", { name: "Import CSV" }).click();
  const bad = path.join(test.info().outputDir, "bad.csv");
  fs.mkdirSync(path.dirname(bad), { recursive: true });
  fs.writeFileSync(bad, "full_name,email\nRavi,not-an-email\n");
  await page.getByLabel(/CSV file/).setInputFiles(bad);
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByText(/Row 2 \(email\)/)).toBeVisible();
  const good = path.join(test.info().outputDir, "good.csv");
  fs.writeFileSync(good, "full_name,email,phone,max_plus_ones,rsvp_status,plus_one_count\nRavi Kumar,ravi@example.com,,1,attending,1\nAsha Menon,asha@example.com,,0,,0\n");
  await page.getByLabel(/CSV file/).setInputFiles(good);
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByText(/1 new · 0 to update · 1 duplicates skipped/)).toBeVisible();
  await page.getByRole("button", { name: /Import 1 guests/ }).click();
  await expect(page.getByText("Import complete")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Ravi Kumar")).toBeVisible();
  const csv = await page.request.get(`/api/weddings/${weddingId}/guests/export`);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain("Ravi Kumar,ravi@example.com");

  // 11. Publishing is blocked before payment
  await page.goto(`${base}/publish`);
  await expect(page.getByText("Choose your package below.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish website" })).toBeDisabled();
  await expect(page.getByText("Drafts can't be shared", { exact: false })).toBeVisible();
  const draftSlug = (await page.request.get(`/w/priya-arjun`)).status();
  expect(draftSlug).toBe(200); // renders the neutral page, never the draft
  await expect((await page.request.get(`/w/priya-arjun`)).text()).resolves.toContain("isn&#x27;t available");

  // 10–11. Checkout → failed payment grants nothing → successful payment (server-verified via signed webhook)
  await page.getByRole("button", { name: /Pay & unlock publishing/ }).click(); // creates the order; the Razorpay window can't load in this sandbox
  await expect(page.getByText("Payment not completed")).toBeVisible();
  await simulatePayment("failed");
  await page.reload();
  await expect(page.getByText("Failed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish website" })).toBeDisabled();

  await page.getByRole("button", { name: /Pay & unlock publishing/ }).click();
  await expect(page.getByText("Payment not completed")).toBeVisible();
  await simulatePayment("captured");
  await page.reload();
  await expect(page.getByText("Premium package active", { exact: false })).toBeVisible();

  // 13–14. Publish
  await page.getByRole("button", { name: "Publish website" }).click();
  await expect(page.getByText("Your website is live!")).toBeVisible();
  const publicLink = page.getByRole("link", { name: /\/w\// }).first();
  const publicUrl = await publicLink.getAttribute("href");
  expect(publicUrl).toMatch(/\/w\/priya-arjun/);

  // 16–17. Share: WhatsApp link + copy link carry the stable URL; QR decodes to the stable /q URL
  const wa = await page.getByRole("link", { name: /Share on WhatsApp/ }).getAttribute("href");
  expect(decodeURIComponent(wa!)).toContain(publicUrl!);
  await page.getByRole("button", { name: /Copy link/ }).click();
  await expect(page.getByText("Link copied!")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(publicUrl);
  const qr = await page.request.get(`/api/weddings/${weddingId}/qr?format=png`);
  expect(qr.headers()["content-type"]).toBe("image/png");
  const png = PNG.sync.read(Buffer.from(await qr.body()));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  expect(decoded?.data).toMatch(/\/q\/[a-z0-9]+$/);

  // 15. Public site without signing in; guest RSVPs; QR route resolves to the same site
  const guest = await browser.newContext();
  const g = await guest.newPage();
  await g.goto(publicUrl!);
  await expect(g.getByRole("heading", { level: 1 })).toContainText("Priya");
  await expect(g.getByText("We met at college in Kochi.")).toBeVisible();
  await expect(g.getByText("asha@example.com")).toHaveCount(0); // guest data never public
  // Social metadata + dynamic Open Graph image; not listed in search engines
  await expect(g.locator('meta[property="og:title"]')).toHaveAttribute("content", /Priya & Arjun/);
  await expect(g.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const ogImage = await g.locator('meta[property="og:image"]').getAttribute("content");
  const og = await g.request.get(ogImage!);
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toBe("image/png");
  await openInvite(g);
  const nameField = g.getByLabel("Your name");
  expect((await nameField.boundingBox())!.height).toBeGreaterThanOrEqual(48); // properly spaced on the live site too
  await nameField.fill("Meera");
  await g.getByText("Joyfully accept").click();
  await g.getByRole("button", { name: "Send RSVP" }).click();
  await expect(g.getByText("Thank you! We can't wait to celebrate with you.")).toBeVisible();
  await g.goto(decoded!.data);
  await expect(g).toHaveURL(publicUrl!);
  await expect(g.getByRole("link", { name: /Share on WhatsApp/ })).toBeVisible();

  await page.goto(`${base}/guests`);
  await expect(page.getByText("Meera")).toBeVisible();
  await expect(page.getByText("Via website")).toBeVisible();

  // 18. Draft edits don't change the live site until republished
  await page.goto(`${base}/details`);
  await page.getByLabel("Partner two").fill("Arjun K");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await g.goto(publicUrl!);
  await expect(g.getByRole("heading", { level: 1 })).not.toContainText("Arjun K");
  await page.goto(`${base}/publish`);
  await page.getByRole("button", { name: "Republish changes" }).click();
  await expect(page.getByText("Republished")).toBeVisible();
  await g.goto(publicUrl!);
  await expect(g.getByRole("heading", { level: 1 })).toContainText("Arjun K");

  // 19. Unpublish blocks public access (page, QR route and media)
  await page.getByRole("button", { name: "Unpublish" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByText("Your website is offline")).toBeVisible();
  await g.goto(publicUrl!);
  await expect(g.getByRole("heading", { name: "This wedding website isn't available" })).toBeVisible();
  await g.goto(decoded!.data);
  await expect(g.getByRole("heading", { name: "This wedding website isn't available" })).toBeVisible();

  // 20. Another user cannot reach this project, its guests, preview or media
  const other = await browser.newContext();
  const o = await other.newPage();
  await register(o, "Mallory");
  for (const url of [base, `${base}/guests`, `/preview/${weddingId}`]) {
    await o.goto(url);
    await expect(o.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  }
  expect((await o.request.get(`/api/weddings/${weddingId}/guests/export`)).status()).toBe(404);
  expect((await o.request.get(`/api/weddings/${weddingId}/qr`)).status()).toBe(404);

  await guest.close();
  await other.close();
});
