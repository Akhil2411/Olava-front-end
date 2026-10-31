"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Alert, Button, Modal, Switch, TextArea, TextField } from "@/components/ui";
import type { ImageElement, LinkItem, Media, TextElement } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { midSentence } from "@/lib/utils/format";
import { uploadMediaAction } from "@/features/gallery/actions";
import { newId, useEditor } from "./context";
import { SortableList } from "./SortableList";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;

export function asText(v: unknown): TextElement {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return { text: typeof o.text === "string" ? o.text : null, hidden: o.hidden === true };
  }
  return { text: typeof v === "string" ? v : null, hidden: false };
}

export function asImage(v: unknown): ImageElement {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return { mediaId: typeof o.mediaId === "string" ? o.mediaId : null, alt: typeof o.alt === "string" ? o.alt : null, hidden: o.hidden === true };
  }
  return { mediaId: null, alt: null, hidden: false };
}

/** Wraps a field so a tap on the matching preview element scrolls to it and focuses it. */
export function FieldFrame({ field, children, className }: { field: string; children: ReactNode; className?: string }) {
  const { focusField } = useEditor();
  const ref = useRef<HTMLDivElement>(null);
  const focused = focusField === field || (focusField?.startsWith(`${field}.`) ?? false);
  useEffect(() => {
    if (!focused || !ref.current) return;
    ref.current.scrollIntoView({ block: "center", behavior: "smooth" });
    ref.current.querySelector<HTMLElement>("input:not([type=file]), textarea, select, button")?.focus({ preventScroll: true });
  }, [focused]);
  return <div ref={ref} data-field={field} className={cn("scroll-mt-4 rounded-2xl", focused && "ring-2 ring-pink-dark/40 ring-offset-4", className)}>{children}</div>;
}

/** Editable, hideable text element. */
export function TextElementField({ field, label, value, onChange, multiline, maxLength, rows = 4, hint, placeholder, canHide = true }: {
  field: string; label: string; value: unknown; onChange: (v: TextElement) => void;
  multiline?: boolean; maxLength: number; rows?: number; hint?: ReactNode; placeholder?: string; canHide?: boolean;
}) {
  const { readOnly } = useEditor();
  const el = asText(value);
  const common = {
    label: <span className="flex items-center justify-between gap-3"><span>{label}</span>{el.hidden ? <span className="text-xs font-normal text-mute">Hidden on your website</span> : null}</span>,
    value: el.text ?? "", maxLength, placeholder, hint, disabled: readOnly,
    className: el.hidden ? "opacity-60" : undefined,
  };
  return (
    <FieldFrame field={field} className="space-y-2">
      {multiline
        ? <TextArea {...common} rows={rows} onChange={(e) => onChange({ ...el, text: e.target.value })} />
        : <TextField {...common} onChange={(e) => onChange({ ...el, text: e.target.value })} />}
      {canHide ? <Switch label={`Show ${midSentence(label)}`} checked={!el.hidden} disabled={readOnly} onChange={(show) => onChange({ ...el, hidden: !show })} /> : null}
    </FieldFrame>
  );
}

/** A plain wording field (not hideable), e.g. "Get directions". Empty uses the default shown as placeholder. */
export function LabelField({ field, label, value, onChange, fallback, maxLength = 60, hint }: {
  field: string; label: string; value: unknown; onChange: (v: string) => void; fallback: string; maxLength?: number;
  /** Where guests see it (added before "Leave empty to use …"). */
  hint?: string;
}) {
  const { readOnly } = useEditor();
  return (
    <FieldFrame field={field}>
      <TextField label={label} value={typeof value === "string" ? value : ""} placeholder={fallback} maxLength={maxLength}
        disabled={readOnly} onChange={(e) => onChange(e.target.value)} hint={`${hint ? `${hint} ` : ""}Leave empty to use “${fallback}”.`} />
    </FieldFrame>
  );
}

export function Toggle({ field, label, checked, onChange, hint }: { field: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const { readOnly } = useEditor();
  return (
    <FieldFrame field={field}>
      <Switch label={label} checked={checked} disabled={readOnly} onChange={onChange} />
      {hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null}
    </FieldFrame>
  );
}

/** Upload one image from the editor (validated and re-encoded by the API). */
export function useUpload() {
  const { weddingId, onUploaded } = useEditor();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const upload = (file: File, done: (m: Media) => void) => {
    setError(null);
    if (!ACCEPT.split(",").includes(file.type)) { setError("Choose a JPEG, PNG or WebP photo."); return; }
    if (file.size > MAX_BYTES) { setError("Photos can be up to 10 MB."); return; }
    start(async () => {
      const form = new FormData();
      form.set("file", file);
      form.set("purpose", "Section");
      const result = await uploadMediaAction(weddingId, form);
      if (!result.ok) { setError(result.error.message); return; }
      onUploaded(result.data);
      done(result.data);
    });
  };
  return { upload, pending, error };
}

function Thumb({ media, className }: { media: Media | undefined; className?: string }) {
  const { weddingId } = useEditor();
  if (!media) return <span className={cn("grid place-items-center rounded-xl bg-tint text-xs text-mute", className)}>No photo</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/media/${weddingId}/${media.id}/thumb`} alt={media.caption ?? ""} className={cn("rounded-xl object-cover", className)} />;
}

/** Choose from the wedding's photos (single or multiple). */
export function MediaPicker({ open, onClose, multiple, selected, onPick, max = 24 }: {
  open: boolean; onClose: () => void; multiple?: boolean; selected: string[]; onPick: (ids: string[]) => void; max?: number;
}) {
  const { media } = useEditor();
  const [chosen, setChosen] = useState<string[]>(selected);
  const { upload, pending, error } = useUpload();
  const toggle = (id: string) => {
    if (!multiple) { onPick([id]); onClose(); return; }
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= max ? c : [...c, id]));
  };
  return (
    <Modal open={open} onClose={onClose} title={multiple ? "Choose photos" : "Choose a photo"} wide>
      {error ? <Alert tone="error" className="mb-3">{error}</Alert> : null}
      <label className={cn("mb-4 inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-pink-dark px-4 py-2 text-sm font-semibold text-pink-dark hover:bg-tint", pending && "opacity-60")}>
        {pending ? "Uploading…" : "＋ Upload a photo"}
        <input type="file" accept={ACCEPT} className="sr-only" disabled={pending}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f, (m) => toggle(m.id)); }} />
      </label>
      {media.length === 0 ? <p className="text-sm text-mute">No photos yet. Upload one above.</p> : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {media.map((m, i) => {
            const on = (multiple ? chosen : selected).includes(m.id);
            return (
              <li key={m.id}>
                <button type="button" onClick={() => toggle(m.id)} aria-pressed={on} aria-label={`${m.caption || `Photo ${i + 1}`}${on ? " (selected)" : ""}`}
                  className={cn("block w-full overflow-hidden rounded-xl ring-offset-2", on ? "ring-4 ring-pink-dark" : "hover:ring-2 hover:ring-line")}>
                  <Thumb media={m} className="aspect-square w-full" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {multiple ? (
        <div className="mt-5 flex justify-end gap-3">
          <span className="mr-auto self-center text-sm text-mute">{chosen.length} of {max} selected</span>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onPick(chosen); onClose(); }}>Use these photos</Button>
        </div>
      ) : null}
    </Modal>
  );
}

/** Editable, hideable image element with alt text. */
export function ImageField({ field, label, value, onChange, canHide = true }: {
  field: string; label: string; value: unknown; onChange: (v: ImageElement) => void; canHide?: boolean;
}) {
  const { media, readOnly } = useEditor();
  const el = asImage(value);
  const current = media.find((m) => m.id === el.mediaId);
  const [picking, setPicking] = useState(false);
  const { upload, pending, error } = useUpload();
  return (
    <FieldFrame field={field} className="space-y-3">
      <p className="text-sm font-semibold">{label}</p>
      <div className="flex items-center gap-3">
        <Thumb media={current} className={cn("h-20 w-20 shrink-0", el.hidden && "opacity-50")} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={readOnly} onClick={() => setPicking(true)}>{current ? "Change" : "Choose photo"}</Button>
          <label className={cn("inline-flex cursor-pointer items-center rounded-full border-[1.5px] border-transparent px-4 py-2 text-sm font-semibold text-ink hover:bg-tint", (readOnly || pending) && "pointer-events-none opacity-60")}>
            {pending ? "Uploading…" : "Upload"}
            <input type="file" accept={ACCEPT} className="sr-only" disabled={readOnly || pending}
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f, (m) => onChange({ ...el, mediaId: m.id })); }} />
          </label>
          {current ? <Button size="sm" variant="ghost" disabled={readOnly} onClick={() => onChange({ ...el, mediaId: null })}>Remove</Button> : null}
        </div>
      </div>
      {el.mediaId && !current ? <p className="text-xs text-warning">This photo was deleted. Choose another one.</p> : null}
      {error ? <p className="text-xs font-medium text-danger" role="alert">{error}</p> : null}
      {current ? (
        <TextField label="Description for screen readers" value={el.alt ?? ""} maxLength={300} disabled={readOnly}
          hint="Describe the photo briefly, e.g. “Priya and Arjun at the beach”." onChange={(e) => onChange({ ...el, alt: e.target.value })} />
      ) : null}
      {canHide ? <Switch label={`Show ${midSentence(label)}`} checked={!el.hidden} disabled={readOnly} onChange={(show) => onChange({ ...el, hidden: !show })} /> : null}
      <MediaPicker open={picking} onClose={() => setPicking(false)} selected={el.mediaId ? [el.mediaId] : []} onPick={([id]) => onChange({ ...el, mediaId: id ?? null })} />
    </FieldFrame>
  );
}

/** Pick several photos (gallery block). */
export function MultiImageField({ field, value, onChange, max = 24 }: { field: string; value: string[]; onChange: (ids: string[]) => void; max?: number }) {
  const { media, readOnly } = useEditor();
  const [picking, setPicking] = useState(false);
  const chosen = value.map((id) => media.find((m) => m.id === id)).filter(Boolean) as Media[];
  return (
    <FieldFrame field={field} className="space-y-3">
      <p className="text-sm font-semibold">Photos <span className="font-normal text-mute">({chosen.length} of {max})</span></p>
      {chosen.length > 0 ? (
        <SortableList grid items={chosen} getId={(m) => m.id} getLabel={(m) => m.caption || "photo"} disabled={readOnly}
          onReorder={(ids) => onChange(ids)} className="grid grid-cols-3 gap-2"
          renderItem={(m, c) => (
            <div className="rounded-xl border border-line p-1">
              <Thumb media={m} className="aspect-square w-full" />
              <div className="flex items-center justify-between">{c.handle}<span className="flex">{c.arrows}</span></div>
            </div>
          )} />
      ) : null}
      <Button size="sm" variant="secondary" disabled={readOnly} onClick={() => setPicking(true)}>Choose photos</Button>
      <MediaPicker open={picking} onClose={() => setPicking(false)} multiple max={max} selected={value} onPick={onChange} />
    </FieldFrame>
  );
}

/**
 * A list of items (FAQ entries, people, links) with add, remove and reorder. Items have no ids of their own,
 * so stable local keys are kept alongside them for drag-and-drop.
 */
export function ListField<T>({ field, title, items, onChange, max, create, itemLabel, renderItem, addLabel }: {
  field: string; title: string; items: T[]; onChange: (items: T[]) => void; max: number; create: () => T;
  itemLabel: (item: T, index: number) => string; renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode; addLabel: string;
}) {
  const { readOnly } = useEditor();
  const [keys, setKeys] = useState<string[]>(() => items.map(() => newId("k")));
  const synced = keys.length === items.length ? keys : items.map((_, i) => keys[i] ?? newId("k"));
  const rows = items.map((item, i) => ({ item, key: synced[i] }));

  const set = (next: { item: T; key: string }[]) => { setKeys(next.map((r) => r.key)); onChange(next.map((r) => r.item)); };
  return (
    <FieldFrame field={field} className="space-y-3">
      <p className="text-sm font-semibold">{title} <span className="font-normal text-mute">({items.length} of {max})</span></p>
      <SortableList items={rows} getId={(r) => r.key} getLabel={(r) => itemLabel(r.item, rows.indexOf(r))} disabled={readOnly}
        onReorder={(ids) => set(ids.map((id) => rows.find((r) => r.key === id)!))} className="space-y-3"
        renderItem={(row, c) => (
          <div className="rounded-2xl border border-line bg-white p-3">
            <div className="mb-2 flex items-center gap-1">
              {c.handle}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{itemLabel(row.item, c.index)}</span>
              {c.arrows}
              <Button size="sm" variant="ghost" disabled={readOnly} aria-label={`Remove ${itemLabel(row.item, c.index)}`}
                onClick={() => set(rows.filter((r) => r.key !== row.key))}>✕</Button>
            </div>
            <div className="space-y-3">{renderItem(row.item, (patch) => set(rows.map((r) => (r.key === row.key ? { ...r, item: { ...r.item, ...patch } } : r))), c.index)}</div>
          </div>
        )} />
      {items.length < max ? (
        <Button size="sm" variant="secondary" disabled={readOnly} onClick={() => set([...rows, { item: create(), key: newId("k") }])}>＋ {addLabel}</Button>
      ) : <p className="text-xs text-mute">You&apos;ve reached the limit of {max}.</p>}
    </FieldFrame>
  );
}

export function LinksField({ field, links, onChange, max, withDescription }: {
  field: string; links: LinkItem[]; onChange: (links: LinkItem[]) => void; max: number; withDescription?: boolean;
}) {
  return (
    <ListField field={field} title="Buttons" items={links} onChange={onChange} max={max} addLabel="Add a button"
      create={() => ({ label: "", url: "https://", description: null })}
      itemLabel={(l, i) => l.label || `Button ${i + 1}`}
      renderItem={(l, update) => (
        <>
          <TextField label="Label" value={l.label} maxLength={60} required onChange={(e) => update({ label: e.target.value })} />
          <TextField label="Link" type="url" inputMode="url" value={l.url} maxLength={2048} required placeholder="https://"
            hint="Must start with https://" onChange={(e) => update({ url: e.target.value.trim() })} />
          {withDescription ? <TextField label="Short description (optional)" value={l.description ?? ""} maxLength={300} onChange={(e) => update({ description: e.target.value || null })} /> : null}
        </>
      )} />
  );
}
