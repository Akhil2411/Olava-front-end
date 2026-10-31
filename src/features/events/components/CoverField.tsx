"use client";

import { useState, useTransition } from "react";
import { Button, Modal } from "@/components/ui";
import { uploadMediaAction } from "@/features/gallery/actions";
import type { Media } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { coverChoices } from "../covers";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;


/**
 * An event's optional cover photo: pick one of the wedding's photos (thumbnails) or upload a new one. Every
 * design shows it on the event's card when there is one, and looks complete without one. Submits as
 * `coverMediaId` with the event form.
 */
export function CoverField({ weddingId, photos: initial, value, onChange }: {
  weddingId: string; photos: Media[]; value: string | null; onChange: (id: string | null) => void;
}) {
  const [uploaded, setUploaded] = useState<Media[]>([]);
  const photos = [...uploaded, ...coverChoices(initial).filter((m) => !uploaded.some((u) => u.id === m.id))];
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const current = photos.find((m) => m.id === value);
  const thumb = (m: Media) => `/api/media/${weddingId}/${m.id}/thumb`;

  const upload = (file: File) => {
    setError(null);
    if (!ACCEPT.includes(file.type)) { setError("Choose a JPEG, PNG or WebP photo."); return; }
    if (file.size > MAX_BYTES) { setError("Photos can be up to 10 MB."); return; }
    start(async () => {
      const form = new FormData();
      form.set("file", file);
      form.set("purpose", "EventCover");
      const result = await uploadMediaAction(weddingId, form);
      if (!result.ok) { setError(result.error.message); return; }
      setUploaded((u) => [result.data, ...u]);
      onChange(result.data.id);
      setPicking(false);
    });
  };

  const uploadButton = (
    <label className={cn("inline-flex cursor-pointer items-center rounded-full border-[1.5px] border-transparent px-4 py-2 text-sm font-semibold text-ink hover:bg-tint", pending && "pointer-events-none opacity-60")}>
      {pending ? "Uploading…" : "Upload a photo"}
      <input type="file" accept={ACCEPT.join(",")} className="sr-only" disabled={pending}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
    </label>
  );

  return (
    <div className="space-y-2" data-cover-field>
      <input type="hidden" name="coverMediaId" value={value ?? ""} />
      <p className="text-sm font-semibold">Cover photo <span className="font-normal text-mute">(optional)</span></p>
      <div className="flex items-center gap-3">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb(current)} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
        ) : <span className="grid h-16 w-24 shrink-0 place-items-center rounded-xl bg-tint text-xs text-mute">No photo</span>}
        <div className="flex flex-wrap gap-1">
          {photos.length > 0 ? <Button type="button" size="sm" variant="secondary" onClick={() => setPicking(true)}>{current ? "Change" : "Choose photo"}</Button> : null}
          {uploadButton}
          {value ? <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>Remove</Button> : null}
        </div>
      </div>
      {value && !current ? <p className="text-xs text-warning">This photo was deleted. Choose another one.</p> : null}
      {error ? <p className="text-xs font-medium text-danger" role="alert">{error}</p> : null}
      <p className="text-xs text-mute">Shown on this event&apos;s card. Skip it if you like: your design looks complete without one.</p>

      <Modal open={picking} onClose={() => setPicking(false)} title="Choose a cover photo">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="listbox" aria-label="Your photos">
          {photos.map((m, i) => (
            <li key={m.id}>
              <button type="button" role="option" aria-selected={m.id === value} onClick={() => { onChange(m.id); setPicking(false); }}
                className={cn("block w-full overflow-hidden rounded-xl border-2", m.id === value ? "border-pink-dark" : "border-transparent hover:border-pink/60")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb(m)} alt={m.caption ?? `Photo ${i + 1}`} className="aspect-square w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">{uploadButton}</div>
      </Modal>
    </div>
  );
}
