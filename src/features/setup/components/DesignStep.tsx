"use client";

import { useMemo, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { ALL, applyFilter, groupByCategory, type CatalogFilter } from "@/features/catalog/filters";
import { CatalogFilters } from "@/features/catalog/TemplateGallery";
import { TemplatePreviewModal } from "@/features/catalog/TemplatePreviewModal";
import { TemplateThumb } from "@/features/catalog/TemplateThumb";
import type { Template } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";

/** `null` = "Decide later". */
export type DesignChoice = string | null;

/**
 * The walkthrough's design step: every template as a picture card (filter by type and price), a live preview of
 * the couple's own draft in that template at phone, tablet or desktop size, and "Decide later".
 * Choosing only selects; the wizard applies it on Next. Prices are display only (the API decides what's owed).
 */
export function DesignStep({ weddingId, templates, current, choice, onChoose }: {
  weddingId: string; templates: Template[]; current: string | null; choice: DesignChoice; onChoose: (key: DesignChoice) => void;
}) {
  const [filter, setFilter] = useState<CatalogFilter>({ category: ALL, tier: ALL });
  const [preview, setPreview] = useState<Template | null>(null);
  const groups = useMemo(() => groupByCategory(applyFilter(templates, filter)), [templates, filter]);

  const card = (t: Template) => {
    const selected = choice === t.key;
    const palettes = t.palettes.slice(0, 6);
    return (
      <li key={t.key} className={cn("min-w-0 rounded-[20px] border-2 bg-white p-2 transition", selected ? "border-pink-dark shadow-[var(--shadow-soft)]" : "border-line hover:border-pink/60")}>
        <button type="button" role="radio" aria-checked={selected} onClick={() => onChoose(t.key)} data-template-key={t.key} className="block w-full text-left">
          <span className="relative block">
            <TemplateThumb template={t} />
            {selected ? (
              <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-pink-dark text-sm font-bold text-white shadow" aria-hidden="true">✓</span>
            ) : null}
          </span>
          <span className="mt-2 flex items-start justify-between gap-2 px-1">
            <span className="min-w-0 font-semibold leading-tight">{t.name}</span>
            {current === t.key ? <Badge tone="success">Current</Badge> : null}
          </span>
          <span className="block px-1 text-xs text-mute">{t.category}</span>
          {t.tier ? <span className="block px-1 text-xs font-medium text-ink">{t.tier.name} · {formatMoney(t.tier.priceMinor, t.tier.currency)} to publish</span> : null}
          {t.features.includes("music") ? <span className="block px-1 text-xs text-pink-dark">♪ Music · opening animation</span> : null}
          {palettes.length > 1 ? (
            <span className="mt-1.5 flex gap-1 px-1" aria-label={`${t.palettes.length} colour choices`}>
              {palettes.map((p) => <span key={p.key} className="size-3.5 rounded-full border border-black/10" style={{ background: p.accent }} aria-hidden="true" />)}
            </span>
          ) : null}
        </button>
        <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={() => setPreview(t)}>
          Live preview<span className="sr-only">: {t.name}</span>
        </Button>
      </li>
    );
  };

  return (
    <div>
      <CatalogFilters templates={templates} filter={filter} onChange={setFilter} compact />
      <div role="radiogroup" aria-label="Design" className="mt-2">
        {current === null ? (
          <button type="button" role="radio" aria-checked={choice === null} onClick={() => onChoose(null)}
            className={cn("mt-4 flex w-full items-center gap-3 rounded-[20px] border-2 border-dashed p-4 text-left transition", choice === null ? "border-pink-dark bg-blush" : "border-line hover:border-pink/60")}>
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold", choice === null ? "border-pink-dark bg-pink-dark text-white" : "border-line")} aria-hidden="true">{choice === null ? "✓" : ""}</span>
            <span>
              <span className="block font-semibold">Decide later</span>
              <span className="block text-sm text-mute">Carry on with your details now. You&apos;ll need a design before you can preview or edit your website (in Edit &amp; design).</span>
            </span>
          </button>
        ) : null}
        {groups.length === 0 ? <p className="mt-4 text-sm text-mute">No templates match these filters.</p> : null}
        {groups.map((g) => (
          <section key={g.slug} aria-labelledby={`design-${g.slug}`} className="mt-5">
            <h3 className="mb-2 font-sans text-sm font-semibold" id={`design-${g.slug}`}>{g.category}</h3>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">{g.templates.map(card)}</ul>
          </section>
        ))}
      </div>

      <TemplatePreviewModal template={preview} onClose={() => setPreview(null)}
        src={preview ? `/preview/${weddingId}?template=${encodeURIComponent(preview.key)}` : ""}
        note="Your names and date in this design. Sections you haven't filled in yet show sample content (marked “Sample”)."
        action={preview ? <Button size="sm" onClick={() => { onChoose(preview.key); setPreview(null); }}>{choice === preview.key ? "Keep this design" : "Choose this design"}</Button> : null} />
    </div>
  );
}
