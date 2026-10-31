"use client";

import { useMemo, useState } from "react";
import { Badge, Button, LinkButton } from "@/components/ui";
import type { Template } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import { ALL, applyFilter, filterQuery, groupByCategory, tiersOf, type CatalogFilter } from "./filters";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { TemplateThumb } from "./TemplateThumb";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium",
        active ? "border-pink-dark bg-pink-dark text-white" : "border-line bg-white text-ink hover:bg-tint")}>
      {children}
    </button>
  );
}

/** Template type (category) and price filters. They combine: e.g. Classic + Standard. */
export function CatalogFilters({ templates, filter, onChange, compact = false }: {
  templates: Template[]; filter: CatalogFilter; onChange: (f: CatalogFilter) => void; compact?: boolean;
}) {
  const groups = groupByCategory(templates);
  const tiers = tiersOf(templates);
  return (
    <div className={cn("divide-y divide-line", compact ? "" : "mt-7")}>
      {groups.length > 1 ? (
        <div role="group" aria-label="Template type" className={cn("flex gap-2 py-3", compact ? "flex-wrap first:pt-0 last:pb-0" : "scroll-row pr-7 first:pt-1 last:pb-1")}>
          <Chip active={filter.category === ALL} onClick={() => onChange({ ...filter, category: ALL })}>All types</Chip>
          {groups.map((g) => (
            <Chip key={g.slug} active={filter.category === g.slug} onClick={() => onChange({ ...filter, category: g.slug })}>{g.category}</Chip>
          ))}
        </div>
      ) : null}
      {tiers.length > 1 ? (
        <div role="group" aria-label="Price" className={cn("flex gap-2 py-3", compact ? "flex-wrap first:pt-0 last:pb-0" : "scroll-row pr-7 first:pt-1 last:pb-1")}>
          <Chip active={filter.tier === ALL} onClick={() => onChange({ ...filter, tier: ALL })}>All prices</Chip>
          {tiers.map((t) => (
            <Chip key={t.code} active={filter.tier === t.code} onClick={() => onChange({ ...filter, tier: t.code })}>
              {t.name} · {formatMoney(t.priceMinor, t.currency)}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Template browser: templates grouped by type (category), filterable by type and price (kept in the address so a
 * filtered view can be shared), with a live preview on sample data at the real device width.
 */
export function TemplateGallery({ templates, hrefFor = (key) => `/dashboard/new?template=${key}`, compact, initialFilter }: {
  templates: Template[]; hrefFor?: (key: string) => string; compact?: boolean; initialFilter?: CatalogFilter;
}) {
  const [filter, setFilter] = useState<CatalogFilter>(initialFilter ?? { category: ALL, tier: ALL });
  const [preview, setPreview] = useState<Template | null>(null);
  const groups = useMemo(() => groupByCategory(applyFilter(templates, filter)), [templates, filter]);
  const count = groups.reduce((n, g) => n + g.templates.length, 0);

  const change = (next: CatalogFilter) => {
    setFilter(next);
    // Shareable without a page reload or a server round trip.
    window.history.replaceState(null, "", `${window.location.pathname}${filterQuery(next)}`);
  };

  const card = (t: Template) => (
    <li key={t.key} className="rounded-[22px] border border-line bg-white p-3 transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
      <TemplateThumb template={t} />
      <div className="px-1.5 pb-1.5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[22px]">{t.name}</h3>
          {t.tier ? <Badge tone={t.isPremium ? "warning" : "pink"}>{t.tier.name} · {formatMoney(t.tier.priceMinor, t.tier.currency)}</Badge> : null}
        </div>
        <p className="text-sm text-mute">{t.description ?? t.category}</p>
        {t.features.includes("music") ? <p className="mt-1 text-xs font-semibold text-pink-dark">♪ Background music · Opening animation</p> : null}
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPreview(t)}>
            Live preview<span className="sr-only">: {t.name}</span>
          </Button>
          <LinkButton href={hrefFor(t.key)} size="sm" className="flex-1">Use this<span className="sr-only">: {t.name}</span></LinkButton>
        </div>
      </div>
    </li>
  );

  return (
    <>
      {compact ? (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{templates.map(card)}</ul>
      ) : (
        <>
          <CatalogFilters templates={templates} filter={filter} onChange={change} />
          <p className="sr-only" role="status" aria-live="polite">{count} {count === 1 ? "template" : "templates"}</p>
          {count === 0 ? (
            <div className="mt-10 rounded-[22px] border border-dashed border-line bg-white p-10 text-center">
              <p className="font-semibold">No templates match these filters.</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => change({ category: ALL, tier: ALL })}>Show all templates</Button>
            </div>
          ) : groups.map((g) => (
            <section key={g.slug} aria-labelledby={`group-${g.slug}`} className="mt-10">
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <h2 id={`group-${g.slug}`} className="text-[28px]">{g.category}</h2>
                <span className="text-sm text-mute">{g.templates.length} {g.templates.length === 1 ? "design" : "designs"}</span>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{g.templates.map(card)}</ul>
            </section>
          ))}
        </>
      )}

      <TemplatePreviewModal template={preview} src={preview ? `/template-sample/${preview.key}` : ""} onClose={() => setPreview(null)}
        note="Sample names and details. Your own details replace them when you use this template."
        action={preview ? <LinkButton href={hrefFor(preview.key)} size="sm">Use this template</LinkButton> : null} />
    </>
  );
}
