import { expect, test } from "@playwright/test";
import { openInvite, register, simulatePayment, skipSetupToEvents } from "./helpers";

// A published Cinematic wedding (from folder 004): the opening, the real RSVP reaching the couple's guest list.
test("a published Cinematic site opens and its RSVP reaches the couple", async ({ page, browser }) => {
  test.setTimeout(180_000);
  await register(page, "Noor Khan");
  await page.getByLabel("Partner one").fill("Noor");
  await page.getByLabel("Partner two").fill("Kabir");
  await page.getByLabel("Wedding date").fill("2027-03-20");
  await skipSetupToEvents(page, "midnight-sapphire");
  const base = `/dashboard/weddings/${page.url().match(/weddings\/([0-9a-f-]+)\//)![1]}`;

  await page.getByRole("button", { name: "+ Add venue" }).click();
  await page.getByLabel("Venue name").fill("Taj Falaknuma");
  await page.getByLabel("City").fill("Hyderabad");
  await page.getByRole("button", { name: "Add venue", exact: true }).click();
  await page.getByRole("button", { name: "+ Add event" }).click();
  await page.getByLabel("Event name").fill("Nikah");
  await page.getByLabel("Starts").fill("2027-03-20T18:00");
  await page.getByLabel("Venue").selectOption({ label: "Taj Falaknuma" });
  await page.getByLabel("Dress code").fill("Midnight blues");
  await page.getByRole("button", { name: "Add event", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nikah" })).toBeVisible();

  await page.goto(`${base}/publish`);
  await page.getByRole("button", { name: /Pay & unlock publishing/ }).click();
  await expect(page.getByText("Payment not completed")).toBeVisible();
  await simulatePayment("captured");
  await page.reload();
  await page.getByRole("button", { name: "Publish website" }).click();
  await expect(page.getByText("Your website is live!")).toBeVisible();
  const publicUrl = (await page.getByRole("link", { name: /\/w\// }).first().getAttribute("href"))!;

  const g = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors: string[] = [];
  g.on("pageerror", (e) => errors.push(e.message));
  await g.goto(publicUrl);
  await expect(g.locator('.olv-ci[data-theme="midnight-sapphire"]')).toBeAttached();
  await openInvite(g);
  await expect(g.getByRole("heading", { level: 1 })).toContainText("Noor");
  await expect(g.getByRole("button", { name: /(Play|Pause) music/ })).toBeVisible();
  await expect(g.locator("#events").getByRole("heading", { name: "Nikah" })).toBeVisible();
  await expect(g.getByRole("link", { name: /Open in Maps/ }).first()).toHaveAttribute("href", /google\.com\/maps/);
  const form = g.locator("section#rsvp form");
  await form.getByLabel("Your name").fill("Zara Ali");
  await form.getByText("Joyfully accept").click();
  await form.getByRole("button", { name: "Send RSVP" }).click();
  await expect(g.getByText("Thank you! We can't wait to celebrate with you.")).toBeVisible();
  expect(errors).toEqual([]);

  await page.goto(`${base}/guests`);
  await expect(page.getByText("Zara Ali")).toBeVisible();
  await expect(page.getByText("Via website")).toBeVisible();
});
