import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated WCAG 2.1 A/AA checks on key public pages (catches contrast, labels, landmarks; not a full audit).
for (const path of ["/", "/templates", "/login", "/register", "/template-sample/sage-garden", "/template-sample/soft-pastel", "/template-sample/warm-earthy", "/template-sample/light-minimal", "/template-sample/bold-modern", "/template-sample/dark-luxury", "/template-sample/rani-gold", "/template-sample/marigold-ink", "/template-sample/pink-city", "/template-sample/pista-rose", "/template-sample/midnight-mehfil", "/template-sample/monsoon-mono", "/template-sample/black-tie", "/template-sample/english-garden", "/template-sample/heirloom", "/template-sample/ivory-letterpress", "/template-sample/riviera", "/template-sample/noor", "/template-sample/royal-gold", "/template-sample/emerald-maharani", "/template-sample/rose-dusk", "/template-sample/midnight-sapphire"]) {
  test(`a11y: ${path}`, async ({ page }) => {
    // Reduced motion: openings and scroll reveals settle at once, so axe never measures text halfway through a fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
    expect(summary).toEqual([]);
  });
}

// BRD responsive requirement: 320px-wide viewports without horizontal overflow.
for (const path of ["/", "/templates", "/login", "/template-sample/sage-garden", "/template-sample/soft-pastel", "/template-sample/warm-earthy", "/template-sample/light-minimal", "/template-sample/bold-modern", "/template-sample/dark-luxury", "/template-sample/rani-gold", "/template-sample/marigold-ink", "/template-sample/pink-city", "/template-sample/pista-rose", "/template-sample/midnight-mehfil", "/template-sample/monsoon-mono", "/template-sample/black-tie", "/template-sample/english-garden", "/template-sample/heirloom", "/template-sample/ivory-letterpress", "/template-sample/riviera", "/template-sample/noor", "/template-sample/royal-gold", "/template-sample/emerald-maharani", "/template-sample/rose-dusk", "/template-sample/midnight-sapphire"]) {
  test(`320px: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
