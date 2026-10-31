import { expect, test } from "@playwright/test";
import { register } from "./helpers";

// Long names must fit every design (2026-10-26): they scale down and wrap at spaces, never run off the screen.
const ONE = "Anandhakrishna Sreekumar";
const TWO = "Amrithalekshmi Balachandran";
const ONLY = process.env.LN_ONLY?.split(",");
const TEMPLATES_ALL = ["black-tie", "english-garden", "heirloom", "ivory-letterpress", "riviera", "sage-garden", "soft-pastel", "warm-earthy",
  "light-minimal", "bold-modern", "dark-luxury", "rani-gold", "marigold-ink", "pink-city", "pista-rose", "midnight-mehfil", "monsoon-mono",
  "noor", "royal-gold", "emerald-maharani", "rose-dusk", "midnight-sapphire"];
const TEMPLATES = ONLY ? TEMPLATES_ALL.filter((t) => ONLY.includes(t)) : TEMPLATES_ALL;

test("long names fit every template on small phones, phones and desktop", async ({ page, browser }) => {
  test.setTimeout(1_500_000); // 22 templates × 3 widths
  await register(page, "Long Names");
  await page.getByLabel("Partner one").fill(ONE);
  await page.getByLabel("Partner two").fill(TWO);
  await page.getByLabel("Wedding date").fill("2027-01-20");
  await page.getByRole("button", { name: "Next: choose your design" }).click();
  await page.waitForURL(/step=design/);
  const id = page.url().match(/setup\/([0-9a-f-]+)/)![1];
  await page.locator('[data-template-key="black-tie"]').click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForURL(/step=sections/);
  const cookies = await page.context().cookies();

  const problems: string[] = [];
  for (const width of [320, 390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 820 }, reducedMotion: "reduce" });
    await ctx.addCookies(cookies);
    const p = await ctx.newPage();
    for (const key of TEMPLATES) {
      await p.goto(`/preview/${id}?template=${key}`);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(700); // the fitter re-runs up to 200 ms after fonts and layout settle
      // Judge the settled page: an opening that ends on its own (Heirloom's crest) changes the layout once more,
      // and the fitter follows it. Look again for a few seconds before calling it a problem.
      const check = () => p.evaluate(([a, b]) => {
        const vw = document.documentElement.clientWidth;
        const out: string[] = [];
        if (document.documentElement.scrollWidth > vw + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth}px)`);
        const words = [...a.split(" "), ...b.split(" ")].filter((w) => w.length > 5);
        for (const el of document.querySelectorAll<HTMLElement>("body *")) {
          // Decorative ribbons and screen-reader-only copies aren't seen, so they may overflow.
          if (el.closest(".marquee, [aria-hidden=true], .sr-only, .olv-sr")) continue;
          const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ");
          if (!words.some((w) => own.toLowerCase().includes(w.toLowerCase()))) continue;
          const range = document.createRange();
          range.selectNodeContents(el);
          for (const r of range.getClientRects()) {
            if (r.width === 0) continue;
            if (r.right > vw + 1 || r.left < -1) { out.push(`"${own.trim().slice(0, 30)}" off screen`); break; }
            // …or cut off by a frame that clips (an arch, a card).
            let cut = false;
            for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
              const cs = getComputedStyle(a);
              if (cs.overflowX === "visible") continue;
              const box = a.getBoundingClientRect();
              if (r.right > box.right + 1 || r.left < box.left - 1) { cut = true; break; }
            }
            if (cut) { out.push(`"${own.trim().slice(0, 30)}" cut off`); break; }
          }
        }
        return [...new Set(out)];
      }, [ONE, TWO]);
      let found = await check();
      for (let tries = 0; found.length && tries < 4; tries++) { await p.waitForTimeout(1000); found = await check(); }
      for (const f of found) problems.push(`${width}px ${key}: ${f}`);
    }
    await ctx.close();
  }
  expect(problems).toEqual([]);
});

test("ordinary names leave every design exactly as designed (nothing is shrunk)", async ({ browser }) => {
  test.setTimeout(600_000);
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const p = await ctx.newPage();
    const fitted: string[] = [];
    for (const key of TEMPLATES) {
      await p.goto(`/template-sample/${key}`);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(500);
      const list = await p.evaluate(() => [...document.querySelectorAll<HTMLElement>("[data-olv-fit-orig]")].map((e) => (e.textContent ?? "").trim().slice(0, 30)));
      for (const t of list) fitted.push(`${width}px ${key}: "${t}"`);
    }
    expect(fitted).toEqual([]);
    await ctx.close();
  }
});
