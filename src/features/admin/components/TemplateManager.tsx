"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Alert, Badge, Button, Checkbox, ConfirmDialog, Modal, SelectField, TextArea, TextField } from "@/components/ui";
import { SortableList } from "@/features/editor/SortableList";
import { cn } from "@/lib/utils/cn";
import { THUMBS } from "@/templates/designs/thumbs.generated";
import {
  clearThumbnailAction, createTemplateAction, deleteTemplateAction, moveTemplateWeddingsAction, reorderTemplatesAction,
  updateTemplateAction, uploadThumbnailAction,
} from "../actions";
import type { AdminDesign, AdminTemplate, AdminTier } from "../types";

const DESIGN_NAMES: Record<string, string> = {
  "enchanted-garden": "Enchanted Garden", "modern-indian": "Modern Indian", cinematic: "Cinematic", "black-tie": "Black Tie",
  "english-garden": "English Garden", heirloom: "Heirloom", "ivory-letterpress": "Ivory Letterpress", riviera: "Riviera",
};
const STATUS: Record<AdminTemplate["status"], [string, "success" | "neutral" | "warning"]> = {
  active: ["Live", "success"], hidden: ["Hidden", "warning"], draft: ["Draft", "neutral"],
};

export function Thumb({ t, className }: { t: Pick<AdminTemplate, "key" | "theme" | "previewImageUrl" | "name">; className?: string }) {
  const src = t.previewImageUrl ?? THUMBS[t.key] ?? THUMBS[t.theme];
  return src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt="" className={cn("aspect-[3/4] rounded-xl object-cover object-top", className)} loading="lazy" />
    : <span className={cn("grid aspect-[3/4] place-items-center rounded-xl bg-tint text-[10px] text-mute", className)}>No image</span>;
}

type EditState = { id: string; name: string; description: string; category: string; tierCode: string; status: string };

export function TemplateManager({ templates: initial, designs, tiers, isAdmin }: { templates: AdminTemplate[]; designs: AdminDesign[]; tiers: AdminTier[]; isAdmin: boolean }) {
  const router = useRouter();
  const [order, setOrder] = useState<string[] | null>(null);
  const templates = order ? order.map((id) => initial.find((t) => t.id === id)!).filter(Boolean) : initial;
  const [edit, setEdit] = useState<EditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<AdminTemplate | null>(null);
  const [moving, setMoving] = useState<AdminTemplate | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const upload = useRef<HTMLInputElement>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const categories = [...new Set(initial.map((t) => t.category).filter(Boolean) as string[])];
  const [form, setForm] = useState({ name: "", description: "", category: categories[0] ?? "", tierCode: tiers[0]?.code ?? "", layout: designs[0]?.layout ?? "", theme: designs[0]?.themes[0]?.key ?? "", publish: false });
  const design = designs.find((d) => d.layout === form.layout);

  const act = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, done: () => void) => start(async () => {
    const r = await fn();
    if (r.ok) { setError(null); done(); router.refresh(); } else setError(r.error?.message ?? "Something went wrong.");
  });

  const reorder = (ids: string[]) => {
    setOrder(ids);
    start(async () => {
      const r = await reorderTemplatesAction(ids);
      if (!r.ok) { setOrder(null); setNotice(null); setError(r.error.message); } else { setNotice("Order saved."); router.refresh(); }
    });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {isAdmin ? <Button onClick={() => { setError(null); setAdding(true); }}>＋ Add a template</Button> : null}
        <p className="text-sm text-mute">{initial.filter((t) => t.status === "active").length} live · {initial.filter((t) => t.status === "hidden").length} hidden · {initial.filter((t) => t.status === "draft").length} drafts</p>
        <span className="ml-auto text-sm" role="status" aria-live="polite">{notice ? <span className="text-success">{notice}</span> : null}</span>
      </div>
      {error && !edit && !adding && !deleting && !moving ? <Alert tone="error" className="mb-4">{error}</Alert> : null}

      <SortableList items={templates} getId={(t) => t.id} getLabel={(t) => t.name} disabled={!isAdmin || pending} onReorder={reorder} className="space-y-2"
        renderItem={(t, c) => (
          <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-line bg-white p-3 sm:flex-nowrap">
            {c.handle}
            <Thumb t={t} className="w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.name} <Badge tone={STATUS[t.status][1]} className="ml-1">{STATUS[t.status][0]}</Badge></p>
              <p className="text-xs text-mute">{DESIGN_NAMES[t.layout] ?? t.layout} · {t.category ?? "No category"} · {t.tierName ?? "No package"} · <code>{t.key}</code></p>
              <p className="text-xs text-mute">{t.weddings} wedding{t.weddings === 1 ? "" : "s"} use it{t.liveSites ? ` (${t.liveSites} live)` : ""}</p>
            </div>
            {c.arrows}
            {isAdmin ? (
              <div className="flex w-full flex-wrap gap-1 sm:w-auto">
                <Button size="sm" variant="secondary" onClick={() => { setError(null); setEdit({ id: t.id, name: t.name, description: t.description ?? "", category: t.category ?? "", tierCode: t.tierCode ?? tiers[0]?.code ?? "", status: t.status }); }}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => { setUploadFor(t.id); upload.current?.click(); }}>Thumbnail</Button>
                {t.previewImageUrl ? <Button size="sm" variant="ghost" onClick={() => act(() => clearThumbnailAction(t.id), () => setNotice("Thumbnail removed."))}>Remove image</Button> : null}
                {t.weddings > 0 ? <Button size="sm" variant="ghost" onClick={() => { setError(null); setMoveTo(""); setMoving(t); }}>Move weddings</Button> : null}
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => { setError(null); setDeleting(t); }}>Delete</Button>
              </div>
            ) : null}
          </div>
        )} />

      <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload a thumbnail"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !uploadFor) return;
          const fd = new FormData();
          fd.set("file", file);
          act(() => uploadThumbnailAction(uploadFor, fd), () => setNotice("Thumbnail uploaded."));
        }} />

      <Modal open={edit !== null} onClose={() => setEdit(null)} title="Edit template">
        {edit ? (
          <div className="space-y-4">
            <TextField label="Name" value={edit.name} maxLength={80} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <TextField label="Category" value={edit.category} maxLength={60} list="admin-categories" onChange={(e) => setEdit({ ...edit, category: e.target.value })}
              hint="Templates are grouped by category in the gallery." />
            <TextArea label="Description" value={edit.description} maxLength={500} rows={3} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            <SelectField label="Package" value={edit.tierCode} onChange={(e) => setEdit({ ...edit, tierCode: e.target.value })}
              hint="Which package a couple needs to publish with this template. Existing purchases keep what they bought.">
              {tiers.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
            </SelectField>
            <SelectField label="Status" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}
              hint="Hidden: no longer offered, but weddings already using it keep working.">
              <option value="active">Live: offered to couples</option>
              <option value="hidden">Hidden</option>
              <option value="draft">Draft: not offered yet</option>
            </SelectField>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
              <Button loading={pending} onClick={() => act(() => updateTemplateAction(edit.id, edit), () => { setEdit(null); setNotice("Template saved."); })}>Save</Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <datalist id="admin-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a template" wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <p className="text-sm text-mute sm:col-span-2">A new template is one of the existing designs with one of its colour themes, under its own name, category and package. (A completely new design needs development.)</p>
          <TextField label="Name" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Category" value={form.category} maxLength={60} list="admin-categories" onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <SelectField label="Design" value={form.layout} onChange={(e) => {
            const d = designs.find((x) => x.layout === e.target.value);
            setForm({ ...form, layout: e.target.value, theme: d?.themes[0]?.key ?? "" });
          }}>
            {designs.map((d) => <option key={d.layout} value={d.layout}>{DESIGN_NAMES[d.layout] ?? d.layout}</option>)}
          </SelectField>
          <SelectField label="Package" value={form.tierCode} onChange={(e) => setForm({ ...form, tierCode: e.target.value })}>
            {tiers.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
          </SelectField>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-semibold">Colour theme</legend>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {design?.themes.map((th) => (
                <button key={th.key} type="button" role="radio" aria-checked={form.theme === th.key} onClick={() => setForm({ ...form, theme: th.key })}
                  className={cn("flex items-center gap-2 rounded-full border-2 py-1.5 pl-1.5 pr-3 text-sm", form.theme === th.key ? "border-pink-dark bg-blush" : "border-line hover:border-pink/60")}>
                  <span className="flex size-7 items-center justify-center rounded-full border border-black/10" style={{ background: th.background }} aria-hidden="true">
                    <span className="size-3.5 rounded-full" style={{ background: th.accent }} />
                  </span>
                  {th.name}
                </button>
              ))}
            </div>
          </fieldset>
          <TextArea label="Description" wrapperClassName="sm:col-span-2" value={form.description} maxLength={500} rows={2} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="sm:col-span-2"><Checkbox label="Offer it to couples straight away (otherwise it's saved as a draft)" checked={form.publish} onChange={(e) => setForm({ ...form, publish: e.target.checked })} /></div>
          {error ? <Alert tone="error" className="sm:col-span-2">{error}</Alert> : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button loading={pending} disabled={!form.name.trim() || !form.theme}
              onClick={() => act(() => createTemplateAction({ ...form, sourceTemplateKey: design?.sourceTemplateKey ?? "" }), () => {
                setAdding(false); setNotice("Template added. Upload a thumbnail if the theme's screenshot isn't right."); setForm((f) => ({ ...f, name: "", description: "" }));
              })}>Add template</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} busy={pending} title={`Delete ${deleting?.name}?`} confirmLabel="Delete template"
        requireText={deleting && deleting.weddings === 0 ? deleting.key : undefined}
        onConfirm={() => deleting && act(() => deleteTemplateAction(deleting.id), () => { setDeleting(null); setNotice("Template deleted."); })}>
        {deleting && deleting.weddings > 0 ? (
          <p className="text-warning">{deleting.weddings} wedding{deleting.weddings === 1 ? " uses" : "s use"} this template, so it can&apos;t be deleted. Hide it instead (Edit → Status), or move those weddings to another template first.</p>
        ) : <p>This can&apos;t be undone. No wedding uses it.</p>}
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>

      <ConfirmDialog open={moving !== null} onClose={() => setMoving(null)} busy={pending} title={`Move weddings off ${moving?.name}?`} confirmLabel="Move weddings"
        onConfirm={() => moving && moveTo && act(() => moveTemplateWeddingsAction(moving.id, moveTo), () => { setMoving(null); setNotice("Weddings moved."); })}>
        <p>All {moving?.weddings} wedding(s), including live sites, switch to the template you choose, with its default colours. Their content, guests, photos and payments don&apos;t change.</p>
        <SelectField label="Move to" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
          <option value="">Choose a template…</option>
          {initial.filter((t) => t.status === "active" && t.id !== moving?.id).map((t) => <option key={t.key} value={t.key}>{t.name} ({t.tierName})</option>)}
        </SelectField>
        <p className="text-xs">Only templates in the same package or a cheaper one are allowed.</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}
