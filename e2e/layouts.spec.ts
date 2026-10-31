import { expect, test } from "@playwright/test";
import { register, skipSetupToEvents } from "./helpers";

// Layout choices work in every design (2026-10-27): the editor offers the design's own style plus shared
// layouts, the preview draws the chosen one, and only wording the design shows is offered.
test("gallery, events and FAQ layouts change the website", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await register(page, "Layout Check");
  await page.getByLabel("Partner one").fill("Anu");
  await page.getByLabel("Partner two").fill("Joel");
  await page.getByLabel("Wedding date").fill("2027-01-20");
  const base = await skipSetupToEvents(page, "rani-gold");
  const id = base.split("/").pop()!;
  const saved = () => expect(page.getByRole("status").filter({ hasText: "✓ Saved to your draft" }).first()).toBeVisible({ timeout: 20_000 });
  const open = async (name: RegExp) => {
    await page.getByRole("button", { name: "☰ Sections" }).click();
    await page.getByRole("button", { name }).first().click();
  };

  await page.goto(`${base}/design`);
  await open(/^Events/);
  const layout = page.getByLabel("Layout");
  await expect(layout).toHaveValue("design");
  const offered = await layout.locator("option").allInnerTexts();
  expect(offered[0]).toBe("Cards (this design's style)");
  expect(offered).not.toContain("Cards"); // the design's own cards aren't offered twice
  await page.getByText("Wording on the event cards").click();
  await expect(page.getByLabel("Directions link")).toHaveCount(0); // this design's cards have no directions link
  await expect(page.getByLabel("“Time” label")).toHaveCount(0);
  await layout.selectOption("event-timeline");
  await saved();
  await expect(page.getByLabel("Directions link")).toBeVisible(); // the shared timeline has one

  await open(/^Gallery/);
  await page.getByLabel("Layout").selectOption("photo-carousel");
  await saved();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/preview/${id}`);
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(page.locator('.olv-ev-root[data-layout="event-timeline"]')).toHaveCount(1);
  await expect(page.locator('.olv-g-root[data-layout="photo-carousel"]')).toHaveCount(1);
  // Arrows are there on a phone too.
  await page.locator(".olv-g-carousel").scrollIntoViewIfNeeded();
  await expect(page.locator(".olv-g-carousel").getByRole("button", { name: "Next photo" })).toBeVisible();

  // Enchanted Garden's own gallery is a carousel: the same choice shows its own carousel, arrows included.
  await page.goto(`/preview/${id}?template=sage-garden`);
  await expect(page.locator(".olv-g-root")).toHaveCount(0);
  await expect(page.locator("#gallery .carousel")).toHaveCount(1);
  await expect(page.locator('.olv-ev-root[data-layout="event-timeline"]')).toHaveCount(0); // its own timeline
});
