import { expect, test, type Page } from "@playwright/test";
import { register, skipSetupToEvents } from "./helpers";

// Section navigation on a phone: instant when fast, themed loader (in the content area only) when slow.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

/** Records when the section loader appears/disappears and when the new section's heading shows up. */
async function watch(page: Page, heading: string) {
  await page.evaluate((h) => {
    const w = window as unknown as { __nav: { shown?: number; hidden?: number; ready?: number } };
    w.__nav = {};
    const t0 = performance.now();
    new MutationObserver(() => {
      const loader = document.querySelector("[data-testid=section-loader]");
      if (loader && w.__nav.shown === undefined) w.__nav.shown = performance.now() - t0;
      if (!loader && w.__nav.shown !== undefined && w.__nav.hidden === undefined) w.__nav.hidden = performance.now() - t0;
      if (w.__nav.ready === undefined && [...document.querySelectorAll("main h2, main h3")].some((e) => e.textContent?.includes(h)))
        w.__nav.ready = performance.now() - t0;
    }).observe(document.body, { subtree: true, childList: true });
  }, heading);
}
const timings = (page: Page) => page.evaluate(() => (window as unknown as { __nav: { shown?: number; hidden?: number; ready?: number } }).__nav);
const navTop = (page: Page) => page.evaluate(() => Math.round(document.querySelector("nav[aria-label='Wedding sections']")!.getBoundingClientRect().top + scrollY));

test("fast section switches show no loader; slow ones show the themed loader without moving the header", async ({ page, context }) => {
  await register(page, "Navigation Tester");
  await page.getByLabel("Partner one").fill("Meera");
  await page.getByLabel("Partner two").fill("Rahul");
  await skipSetupToEvents(page, "dark-luxury");
  const tabs = page.getByRole("navigation", { name: "Wedding sections" });

  // Fast: a tap after the finger lands (touch intent prefetches the tab) → no loader at all.
  await tabs.getByRole("link", { name: "Details", exact: true }).hover();
  await page.waitForTimeout(500);
  await watch(page, "Wedding details");
  await tabs.getByRole("link", { name: "Details", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wedding details" })).toBeVisible();
  await page.waitForTimeout(300);
  expect((await timings(page)).shown).toBeUndefined();

  // Slow: throttled mobile network (Slow 4G-like bandwidth, high latency).
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 900, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  const before = await navTop(page);
  await watch(page, "Gallery");
  await tabs.getByRole("link", { name: "Gallery", exact: true }).click();

  const loader = page.getByTestId("section-loader");
  await expect(loader).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Loading section…" })).toBeAttached();
  expect(await navTop(page)).toBe(before);                                       // header and tabs stay put
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Meera");    // header still shown
  // Themed: Dark Luxury's gold accent is too light on the dashboard, so the palette's onyx colour is used.
  const fillStop = await loader.locator("linearGradient stop").last().evaluate((s) => getComputedStyle(s).stopColor);
  expect(fillStop).toBe("rgb(14, 13, 11)");
  const emptyFill = await loader.locator("[data-part=empty]").evaluate((u) => getComputedStyle(u).fill);
  expect(emptyFill).not.toBe("rgb(14, 13, 11)");                                  // light tint of the same colour
  // Animated (fill rises, then fades) — CSS animations are running.
  expect(await loader.locator(".olava-loader-rise").evaluate((r) => getComputedStyle(r).animationName)).toBe("olava-rise");

  await expect(page.getByText("No photos yet")).toBeVisible({ timeout: 30_000 });
  await expect(loader).toHaveCount(0, { timeout: 5_000 });
  const t = await timings(page);
  expect(t.shown!).toBeGreaterThanOrEqual(150);                                   // only after ~200 ms
  expect(t.hidden! - t.shown!).toBeGreaterThanOrEqual(380);                       // at least ~400 ms on screen
  expect(t.hidden!).toBeGreaterThanOrEqual(t.ready! - 50);                        // kept going until the section was ready
  expect(await navTop(page)).toBe(before);
});

test("with reduced motion the loader pulses instead of filling", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await register(page, "Calm Tester");
  await page.getByLabel("Partner one").fill("Asha");
  await page.getByLabel("Partner two").fill("Dev");
  await skipSetupToEvents(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 1500, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await page.getByRole("navigation", { name: "Wedding sections" }).getByRole("link", { name: "Settings", exact: true }).click();
  const loader = page.getByTestId("section-loader");
  await expect(loader).toBeVisible();
  expect(await loader.locator(".olava-loader-rise").evaluate((r) => getComputedStyle(r).animationName)).toBe("none");
  expect(await loader.locator(".olava-loader-fill").evaluate((g) => getComputedStyle(g).animationName)).toBe("olava-pulse");
  await context.close();
});

test("leaving the editor mid-typing keeps the edit, and coming back shows it (cached tab, newest edit wins)", async ({ page }) => {
  await register(page, "Quick Switcher");
  await page.getByLabel("Partner one").fill("Lila");
  await page.getByLabel("Partner two").fill("Omar");
  await skipSetupToEvents(page, "soft-pastel");
  const tabs = page.getByRole("navigation", { name: "Wedding sections" });
  await tabs.getByRole("link", { name: "Edit & design", exact: true }).click();
  await page.locator("#welcome [data-edit-field=heading]").click();
  await page.getByRole("dialog").getByLabel(/^Heading/).fill("Where it began");
  await page.getByRole("dialog").getByRole("button", { name: "Done" }).click();
  // Leave before the autosave pause has passed, then come straight back.
  await tabs.getByRole("link", { name: "Details", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wedding details" })).toBeVisible();
  await tabs.getByRole("link", { name: "Edit & design", exact: true }).click();
  await expect(page.locator("#welcome").getByRole("heading", { name: "Where it began" })).toBeVisible();
  // It really was saved (flushed when leaving), not just kept in memory.
  await page.reload();
  await expect(page.locator("#welcome").getByRole("heading", { name: "Where it began" })).toBeVisible();
  await expect(page.getByRole("status").getByText("Saved to your draft").first()).toBeVisible();
});
