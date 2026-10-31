"use client";

import { useRef, useState, useTransition } from "react";
import { Alert, Button, Card, CardHeader, ConfirmDialog, EmptyState } from "@/components/ui";
import type { Media } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { SortableList } from "@/features/editor/SortableList";
import { deleteMediaAction, reorderGalleryAction, updateCaptionAction, uploadMediaAction } from "../actions";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

interface UploadStatus { name: string; state: "uploading" | "done" | "error"; message?: string }

/**
 * Upload, caption, reorder and remove gallery photos. The browser checks type/size for quick feedback,
 * but the API is the real gatekeeper (it decodes the image, strips metadata and re-encodes it).
 */
export function GalleryManager({ weddingId, media: saved, limit, readOnly, compact = false }: {
  weddingId: string; media: Media[]; limit: number; readOnly: boolean;
  /** Inside the site editor: no card frame, smaller grid. */
  compact?: boolean;
}) {
  // Optimistic order while a reorder is saving, so the photo doesn't jump back.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const media = pendingOrder ? pendingOrder.map((id) => saved.find((m) => m.id === id)).filter((m): m is Media => !!m) : saved;
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Media | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, Math.max(0, limit - media.length));
    if (list.length < files.length) setError(`Only ${limit} photos fit in the gallery; extra files were skipped.`);
    setUploads(list.map((f) => ({ name: f.name, state: "uploading" })));
    for (const [i, file] of list.entries()) {
      const set = (s: Partial<UploadStatus>) => setUploads((u) => u.map((x, j) => (j === i ? { ...x, ...s } : x)));
      if (!ACCEPT.includes(file.type)) { set({ state: "error", message: "Not a JPEG, PNG or WebP image." }); continue; }
      if (file.size > MAX_BYTES) { set({ state: "error", message: "Larger than 10 MB." }); continue; }
      const form = new FormData();
      form.set("file", file);
      form.set("purpose", "Gallery");
      const result = await uploadMediaAction(weddingId, form);
      set(result.ok ? { state: "done" } : { state: "error", message: result.error.message });
    }
    if (input.current) input.current.value = "";
  };

  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>) => start(async () => {
    const result = await fn();
    setError(result.ok ? null : result.error?.message ?? "Something went wrong.");
  });

  const reorder = (ids: string[]) => {
    setPendingOrder(ids);
    start(async () => {
      const result = await reorderGalleryAction(weddingId, ids);
      setError(result.ok ? null : result.error.message);
      setPendingOrder(null);
    });
  };

  const uploading = uploads.some((u) => u.state === "uploading");

  const Frame = compact ? "div" : Card;
  return (
    <Frame>
      <CardHeader title="Gallery" description={`${media.length} of ${limit} photos · JPEG, PNG or WebP up to 10 MB. Location data is removed automatically.`}
        action={!readOnly ? (
          <>
            <input ref={input} id="gallery-upload" type="file" accept={ACCEPT.join(",")} multiple className="sr-only"
              onChange={(e) => upload(e.target.files)} disabled={uploading || media.length >= limit} />
            <label htmlFor="gallery-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-pink-dark bg-pink-dark px-4 py-2 text-sm font-semibold text-white hover:bg-pink-deep has-[:disabled]:opacity-60">
              {uploading ? "Uploading…" : "+ Upload photos"}
            </label>
          </>
        ) : null} />

      {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
      {uploads.length > 0 ? (
        <ul className="mb-4 space-y-1 text-sm" aria-live="polite">
          {uploads.map((u, i) => (
            <li key={i} className={u.state === "error" ? "text-danger" : u.state === "done" ? "text-success" : "text-mute"}>
              {u.state === "uploading" ? "⏳" : u.state === "done" ? "✓" : "✕"} {u.name}{u.message ? `: ${u.message}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      {media.length > 0 ? (
        <p className="text-xs text-mute" data-caption-help>Captions show when guests open a photo full screen, and on carousel slides. Screen readers read them out too.</p>
      ) : null}
      {media.length === 0 ? (
        <EmptyState icon="📸" title="No photos yet">Upload a few favourites. You can caption, reorder or remove them at any time.</EmptyState>
      ) : (
        <SortableList grid items={media} getId={(m) => m.id} getLabel={(m) => m.caption || `photo ${media.indexOf(m) + 1}`}
          disabled={readOnly || pending} onReorder={reorder}
          className={cn("grid gap-4", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}
          itemClassName="overflow-hidden rounded-2xl border border-line bg-white"
          renderItem={(m, c) => (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${weddingId}/${m.id}/thumb`} alt={m.caption ?? `Gallery photo ${c.index + 1}`} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="space-y-2 p-3">
                <CaptionField key={m.caption ?? ""} initial={m.caption ?? ""} disabled={readOnly || pending}
                  label={`Caption for photo ${c.index + 1}`} onSave={(caption) => run(() => updateCaptionAction(weddingId, m.id, caption))} />
                {!readOnly ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">{c.handle}{c.arrows}</div>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(m)} aria-label={`Remove photo ${c.index + 1}`}>Remove</Button>
                  </div>
                ) : null}
              </div>
            </>
          )} />
      )}

      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} title="Remove this photo?" confirmLabel="Remove" busy={pending}
        onConfirm={() => { const m = deleting; setDeleting(null); if (m) run(() => deleteMediaAction(weddingId, m.id)); }}>
        <p>The photo is deleted permanently, including from your live website if it&apos;s published.</p>
      </ConfirmDialog>
    </Frame>
  );
}

function CaptionField({ initial, label, disabled, onSave }: { initial: string; label: string; disabled: boolean; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onSave(value); }}>
      <label className="sr-only" htmlFor={label}>{label}</label>
      <input id={label} value={value} maxLength={500} disabled={disabled} placeholder="Add a caption"
        onChange={(e) => setValue(e.target.value)} onBlur={() => { if (value !== initial) onSave(value); }}
        className="min-w-0 flex-1 rounded-xl bg-tint px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-pink-dark" />
      {value !== initial ? <Button type="submit" size="sm" disabled={disabled}>Save</Button> : null}
    </form>
  );
}
