import { describe, expect, it } from "vitest";
import type { Template } from "@/lib/api/types";
import { ALL, applyFilter, filterQuery, groupByCategory, parseFilter, tiersOf } from "@/features/catalog/filters";
import { DESIGN_KEYS } from "@/templates/designs/available";
import { DESIGNS } from "@/templates/designs/registry";
import { midSentence } from "@/lib/utils/format";

const standard = { code: "standard", name: "Standard", rank: 1, priceMinor: 69_900, currency: "INR" };
const premium = { code: "premium", name: "Premium", rank: 2, priceMinor: 119_900, currency: "INR" };
const tpl = (key: string, category: string, tier = premium): Template => ({
  key, name: key, description: null, category, isPremium: tier === premium, versionNumber: 1, layout: "x", tier,
  sections: [], palettes: [], fonts: [], defaultPalette: "", defaultFont: "", features: [], defaultSections: [],
});
const catalogue = [
  tpl("sage-garden", "Enchanted Garden"), tpl("rani-gold", "Modern Indian"), tpl("soft-pastel", "Enchanted Garden"),
  tpl("black-tie", "Classic", standard), tpl("riviera", "Classic", standard),
];

describe("template gallery filters", () => {
  it("groups templates by category in catalogue order", () => {
    expect(groupByCategory(catalogue).map((g) => [g.category, g.slug, g.templates.map((t) => t.key)])).toEqual([
      ["Enchanted Garden", "enchanted-garden", ["sage-garden", "soft-pastel"]],
      ["Modern Indian", "modern-indian", ["rani-gold"]],
      ["Classic", "classic", ["black-tie", "riviera"]],
    ]);
  });

  it("combines the category and price filters", () => {
    const keys = (category: string, tier: string) => applyFilter(catalogue, { category, tier }).map((t) => t.key);
    expect(keys("classic", "standard")).toEqual(["black-tie", "riviera"]);
    expect(keys("classic", "premium")).toEqual([]);                    // no match → the gallery's empty state
    expect(keys(ALL, "premium")).toEqual(["sage-garden", "rani-gold", "soft-pastel"]);
    expect(keys("enchanted-garden", ALL)).toEqual(["sage-garden", "soft-pastel"]);
    expect(tiersOf(catalogue).map((t) => t.code)).toEqual(["standard", "premium"]); // cheapest first
  });

  it("reads and writes the filter in the address, ignoring unknown values", () => {
    expect(parseFilter(catalogue, { type: "classic", price: "standard" })).toEqual({ category: "classic", tier: "standard" });
    expect(parseFilter(catalogue, { type: "nope", price: ["premium", "x"] })).toEqual({ category: ALL, tier: "premium" });
    expect(filterQuery({ category: "modern-indian", tier: "premium" })).toBe("?type=modern-indian&price=premium");
    expect(filterQuery({ category: ALL, tier: ALL })).toBe("");
  });

  it("lists exactly the designs the renderer has", () => {
    expect([...DESIGN_KEYS].sort()).toEqual(Object.keys(DESIGNS).sort());
  });
});

describe("midSentence", () => {
  it("lowercases ordinary labels but keeps names and acronyms", () => {
    expect(midSentence("Small label")).toBe("small label");
    expect(midSentence("Meera's family line")).toBe("Meera's family line");
    expect(midSentence("RSVP button")).toBe("RSVP button");
  });
});
