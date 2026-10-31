"use client";

import { useState, useTransition } from "react";
import { Alert, Badge, Button, Card, CardHeader } from "@/components/ui";
import { ALL, applyFilter, groupByCategory, type CatalogFilter } from "@/features/catalog/filters";
import { CatalogFilters } from "@/features/catalog/TemplateGallery";
import { TemplatePreviewModal } from "@/features/catalog/TemplatePreviewModal";
import { TemplateThumb } from "@/features/catalog/TemplateThumb";
import type { ApiProblem } from "@/lib/api/problem";
import type { Template, Wedding } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import { updateDesignAction } from "../actions";

/**
 * Choose/switch template and theme. Hovering (or tapping) a template offers "Live preview" (the saved draft shown
 * in that template, nothing saved) and "Use this" (applies it straight away). Colour and font choices of the
 * current template apply on tap. Switching never loses content: the API keeps every section. Price info is
 * display-only; the API decides what's owed.
 */
export function TemplatePicker({ wedding, templates, entitledRank, readOnly, embedded = false }: {
  wedding: Wedding; templates: Template[]; entitledRank: number | null; readOnly: boolean;
  /** Inside the editor's side panel/bottom sheet: no card chrome or title (the panel has them), two columns. */
  embedded?: boolean;
}) {
  const currentKey = wedding.template?.key ?? null;
  const current = templates.find((t) => t.key === currentKey) ?? null;
  const [palette, setPalette] = useState<string | null>(wedding.theme.palette);
  const [font, setFont] = useState<string | null>(wedding.theme.font);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [applying, setApplying] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [preview, setPreview] = useState<Template | null>(null);
  const [filter, setFilter] = useState<CatalogFilter>({ category: ALL, tier: ALL });
  const groups = groupByCategory(applyFilter(templates, filter));

  const needsUpgrade = (t: Template) => !!t.tier && entitledRank !== null && t.tier.rank > entitledRank;

  /** Palette/font left out: the API keeps the current ones when the new template offers them, else its defaults. */
  const save = (design: { templateKey: string; palette?: string; font?: string }, done: string) => start(async () => {
    setApplying(design.templateKey);
    const result = await updateDesignAction(wedding.id, design);
    setApplying(null);
    if (!result.ok) {
      setProblem(result.error); setNotice(null);
      setPalette(wedding.theme.palette); setFont(wedding.theme.font);
      return;
    }
    setProblem(null);
    setNotice(done);
  });

  const use = (t: Template) => {
    setPreview(null);
    setRevealed(null);
    save({ templateKey: t.key }, `${t.name} applied. Your content carried over.`);
  };

  const description = "Switch any time: your details, events, photos and guests stay as they are.";
  const thumbCls = "aspect-[3/4] rounded-[18px]";

  const card = (t: Template) => {
    const isCurrent = t.key === currentKey;
    const open = revealed === t.key;
    return (
      <li key={t.key} className={cn("group relative min-w-0 rounded-[18px] border-2 p-2 transition",
        isCurrent ? "border-pink-dark" : "border-transparent hover:border-line")}>
        <div className="relative">
          {/* Pointer/touch only: a tap shows the overlay (hover does it on desktop). Keyboard users tab to the buttons. */}
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => setRevealed(open ? null : t.key)}
            className={cn("block w-full", thumbCls)}>
            <TemplateThumb template={t} />
          </button>
          <div onClick={(e) => { if (e.target === e.currentTarget) setRevealed(null); }}
            className={cn("absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/50 p-3 transition-opacity",
              thumbCls,
              open ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-has-[:focus-visible]:pointer-events-auto group-has-[:focus-visible]:opacity-100")}>
            <Button size="sm" variant="white" className="w-full max-w-36" onClick={() => { setRevealed(null); setPreview(t); }}>
              Live preview<span className="sr-only">: {t.name}</span>
            </Button>
            {isCurrent ? null : (
              <Button size="sm" className="w-full max-w-36" loading={applying === t.key} onClick={() => use(t)}>
                Use this<span className="sr-only">: {t.name}</span>
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <span className="min-w-0 font-semibold leading-tight">{t.name}</span>
          {isCurrent ? <Badge tone="success">Current</Badge> : null}
        </div>
        {t.tier ? <span className="block px-1 text-xs text-mute">{t.tier.name} · {formatMoney(t.tier.priceMinor, t.tier.currency)}</span> : null}
      </li>
    );
  };

  const body = (
    <>
      {embedded ? <p className="mb-4 text-sm text-mute">{description}</p> : <CardHeader title="Template & colours" description={description} />}
      {problem ? <Alert tone="error" className="mb-4">{problem.message}</Alert> : null}
      {notice ? <Alert tone="success" className="mb-4">{notice}</Alert> : null}
      <fieldset disabled={readOnly || pending} className="min-w-0">
        <legend className="sr-only">Template</legend>

        {current ? (
          <div className="mb-6 rounded-2xl bg-tint p-4">
            {current.palettes.length < 2 && current.fonts.length < 2 ? (
              <p className="text-sm text-mute">{current.name}&apos;s colours and fonts are part of the design.{current.features.includes("music") ? " It includes background music (see 🎵 Music)." : ""}</p>
            ) : (
              <div className="grid gap-4">
                {current.palettes.length > 1 ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold">Colour palette</p>
                    <div role="radiogroup" aria-label="Colour palette" className="flex flex-wrap gap-2">
                      {current.palettes.map((p) => (
                        <button key={p.key} type="button" role="radio" aria-checked={palette === p.key}
                          onClick={() => { if (palette === p.key) return; setPalette(p.key); save({ templateKey: current.key, palette: p.key }, `Colours changed to ${p.name}.`); }}
                          className={cn("flex items-center gap-2 rounded-full border-2 bg-white py-1 pl-1 pr-3 text-sm", palette === p.key ? "border-pink-dark" : "border-line")}>
                          <span aria-hidden="true" className="flex overflow-hidden rounded-full border border-black/10">
                            <span className="h-6 w-3" style={{ background: p.background }} />
                            <span className="h-6 w-3" style={{ background: p.accent }} />
                          </span>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {current.fonts.length > 1 ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold">Typography</p>
                    <div role="radiogroup" aria-label="Typography" className="flex flex-wrap gap-2">
                      {current.fonts.map((f) => (
                        <button key={f.key} type="button" role="radio" aria-checked={font === f.key}
                          onClick={() => { if (font === f.key) return; setFont(f.key); save({ templateKey: current.key, font: f.key }, `Typography changed to ${f.name}.`); }}
                          className={cn("rounded-full border-2 bg-white px-4 py-1.5 text-sm", font === f.key ? "border-pink-dark" : "border-line")}
                          style={{ fontFamily: f.heading === "Playfair Display" ? "'Playfair Display Variable', serif" : "'Cormorant Garamond', serif" }}>
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {needsUpgrade(current) ? (
              <Alert tone="warning" className="mt-4">
                {current.name} is part of the {current.tier!.name} package. You can design with it for free; publishing it needs an upgrade (you only pay the difference).
              </Alert>
            ) : null}
          </div>
        ) : null}

        <CatalogFilters templates={templates} filter={filter} onChange={setFilter} compact />
        {groups.length === 0 ? <p className="mt-4 text-sm text-mute">No templates match these filters.</p> : null}
        {groups.map((g) => (
          <section key={g.slug} aria-labelledby={`picker-${g.slug}`} className="mt-5">
            <h3 className="mb-2 font-sans text-sm font-semibold" id={`picker-${g.slug}`}>{g.category}</h3>
            <ul className={cn("grid grid-cols-2 gap-3", !embedded && "md:grid-cols-3")}>{g.templates.map(card)}</ul>
          </section>
        ))}
      </fieldset>

      <TemplatePreviewModal template={preview} onClose={() => setPreview(null)}
        src={preview ? (currentKey ? `/preview/${wedding.id}?template=${encodeURIComponent(preview.key)}` : `/template-sample/${preview.key}`) : ""}
        note={currentKey
          ? preview?.key === currentKey ? "Your saved draft. Unsaved typing appears after it saves." : "Your saved draft shown in this template. Nothing changes until you choose Use this template."
          : "Sample names and details. Your own details replace them when you use this template."}
        action={preview ? (preview.key === currentKey
          ? <Badge tone="success">✓ Your current design</Badge>
          : <Button size="sm" onClick={() => use(preview)} disabled={readOnly || pending}>Use this template</Button>) : null}>
        {preview && needsUpgrade(preview) ? (
          <Alert tone="warning">
            {preview.name} is part of the {preview.tier!.name} package. You can design with it for free; publishing it needs an upgrade (you only pay the difference).
          </Alert>
        ) : null}
      </TemplatePreviewModal>
    </>
  );
  return embedded ? <div className="min-w-0">{body}</div> : <Card>{body}</Card>;
}
