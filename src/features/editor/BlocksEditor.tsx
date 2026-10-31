"use client";

import { useState } from "react";
import { Button, ConfirmDialog, Switch, TextArea, TextField } from "@/components/ui";
import type { BlockType, ContentBlock } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { newId, useEditor } from "./context";
import { asImage, FieldFrame, ImageField, MultiImageField } from "./fields";
import { SortableList } from "./SortableList";
import { VideoField } from "./VideoField";

export const BLOCK_TYPES: { type: BlockType; label: string; icon: string; hint: string }[] = [
  { type: "heading", label: "Heading", icon: "H", hint: "A short title" },
  { type: "text", label: "Text", icon: "¶", hint: "A paragraph" },
  { type: "image", label: "Photo", icon: "▣", hint: "One photo with a caption" },
  { type: "gallery", label: "Photo gallery", icon: "▦", hint: "Up to 24 photos" },
  { type: "video", label: "Video", icon: "▶", hint: "Upload one, or a YouTube or Vimeo link" },
  { type: "button", label: "Button", icon: "⬭", hint: "A link to another page" },
  { type: "divider", label: "Divider", icon: "—", hint: "A decorative line" },
  { type: "map", label: "Map", icon: "📍", hint: "A place with “Open in Maps”" },
];

const labelOf = (b: ContentBlock) => {
  const t = BLOCK_TYPES.find((x) => x.type === b.type)?.label ?? "Block";
  const detail = b.type === "heading" || b.type === "text" ? b.text : b.type === "button" ? b.label : b.type === "map" ? b.name : "";
  return detail ? `${t}: ${detail.slice(0, 40)}` : t;
};

function create(type: BlockType): ContentBlock {
  const id = newId("b");
  switch (type) {
    case "heading": return { id, hidden: false, type, text: "" };
    case "text": return { id, hidden: false, type, text: "" };
    case "image": return { id, hidden: false, type, mediaId: null, caption: null, alt: null };
    case "gallery": return { id, hidden: false, type, mediaIds: [] };
    case "video": return { id, hidden: false, type, provider: null, videoId: null, title: null, videoMediaId: null };
    case "button": return { id, hidden: false, type, label: "", url: "https://" };
    case "divider": return { id, hidden: false, type };
    case "map": return { id, hidden: false, type, name: "", address: null, url: null };
  }
}

export function BlocksEditor({ blocks, onChange }: { blocks: ContentBlock[]; onChange: (blocks: ContentBlock[]) => void }) {
  const { readOnly } = useEditor();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ContentBlock | null>(null);
  const update = (id: string, patch: Partial<ContentBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b)));

  return (
    <FieldFrame field="blocks" className="space-y-3">
      <p className="text-sm font-semibold">Content <span className="font-normal text-mute">({blocks.length} of 30 blocks)</span></p>
      {blocks.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-mute">Add your first block below.</p> : null}
      <SortableList items={blocks} getId={(b) => b.id} getLabel={labelOf} disabled={readOnly} onReorder={(ids) => onChange(ids.map((id) => blocks.find((b) => b.id === id)!))}
        className="space-y-3"
        renderItem={(block, c) => (
          <FieldFrame field={`blocks.${block.id}`}>
            <div className={cn("rounded-2xl border border-line bg-white p-3", block.hidden && "border-dashed bg-blush/40")}>
              <div className="mb-2 flex items-center gap-1">
                {c.handle}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{labelOf(block)}</span>
                {c.arrows}
              </div>
              <div className="space-y-3">
                <BlockFields block={block} update={(patch) => update(block.id, patch)} />
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Switch label="Show on website" checked={!block.hidden} disabled={readOnly} onChange={(show) => update(block.id, { hidden: !show })} />
                  <Button size="sm" variant="ghost" className="text-danger" disabled={readOnly} onClick={() => setDeleting(block)}>Delete block</Button>
                </div>
              </div>
            </div>
          </FieldFrame>
        )} />

      {blocks.length < 30 ? (
        adding ? (
          <div className="rounded-2xl border border-line p-3">
            <p className="mb-2 text-sm font-semibold">Add a block</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BLOCK_TYPES.map((t) => (
                <li key={t.type}>
                  <button type="button" onClick={() => { onChange([...blocks, create(t.type)]); setAdding(false); }}
                    className="flex h-full w-full flex-col items-center gap-1 rounded-xl border border-line p-3 text-center text-sm hover:border-pink-dark hover:bg-tint">
                    <span aria-hidden="true" className="text-xl">{t.icon}</span>
                    <span className="font-semibold">{t.label}</span>
                    <span className="text-xs text-mute">{t.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        ) : <Button size="sm" variant="secondary" disabled={readOnly} onClick={() => setAdding(true)}>＋ Add block</Button>
      ) : <p className="text-xs text-mute">A section can hold up to 30 blocks.</p>}

      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} title="Delete this block?" confirmLabel="Delete"
        onConfirm={() => { if (deleting) onChange(blocks.filter((b) => b.id !== deleting.id)); setDeleting(null); }}>
        <p>“{deleting ? labelOf(deleting) : ""}” will be removed from this section.</p>
      </ConfirmDialog>
    </FieldFrame>
  );
}

function BlockFields({ block, update }: { block: ContentBlock; update: (patch: Partial<ContentBlock>) => void }) {
  const { readOnly } = useEditor();
  switch (block.type) {
    case "heading":
      return <TextField label="Heading" value={block.text} maxLength={150} required disabled={readOnly} onChange={(e) => update({ text: e.target.value })} />;
    case "text":
      return <TextArea label="Text" value={block.text} maxLength={4000} rows={5} required disabled={readOnly} onChange={(e) => update({ text: e.target.value })} />;
    case "image":
      return (
        <>
          <ImageField field={`blocks.${block.id}.image`} label="Photo" canHide={false} value={{ mediaId: block.mediaId, alt: block.alt, hidden: false }}
            onChange={(img) => { const v = asImage(img); update({ mediaId: v.mediaId, alt: v.alt }); }} />
          <TextField label="Caption (optional)" value={block.caption ?? ""} maxLength={500} disabled={readOnly} onChange={(e) => update({ caption: e.target.value || null })} />
        </>
      );
    case "gallery":
      return <MultiImageField field={`blocks.${block.id}.photos`} value={block.mediaIds} onChange={(mediaIds) => update({ mediaIds })} />;
    case "video": {
      const uploading = block.videoMediaId !== undefined && block.videoMediaId !== null || block.url === undefined && !block.videoId;
      const current = block.url ?? (block.provider === "youtube" && block.videoId ? `https://www.youtube.com/watch?v=${block.videoId}`
        : block.provider === "vimeo" && block.videoId ? `https://vimeo.com/${block.videoId}` : "");
      return (
        <>
          <div role="radiogroup" aria-label="Video source" className="flex flex-wrap gap-2">
            <Button size="sm" variant={uploading ? "primary" : "secondary"} role="radio" aria-checked={uploading} disabled={readOnly}
              onClick={() => update({ url: undefined, provider: null, videoId: null, videoMediaId: block.videoMediaId ?? null })}>Upload a video</Button>
            <Button size="sm" variant={!uploading ? "primary" : "secondary"} role="radio" aria-checked={!uploading} disabled={readOnly}
              onClick={() => update({ url: current, videoMediaId: null, posterMediaId: null })}>YouTube or Vimeo link</Button>
          </div>
          {uploading ? (
            <VideoField field={`blocks.${block.id}.video`} videoMediaId={block.videoMediaId ?? null} posterMediaId={block.posterMediaId ?? null}
              onChange={(next) => update({ ...next, url: undefined, provider: null, videoId: null })} />
          ) : (
            <TextField label="YouTube or Vimeo link" type="url" inputMode="url" value={current} maxLength={2048} disabled={readOnly}
              placeholder="https://www.youtube.com/watch?v=…" hint="Paste the video's address. Only YouTube and Vimeo videos can be shown."
              onChange={(e) => update({ url: e.target.value.trim(), provider: null, videoId: null })} />
          )}
          <TextField label="Title (for screen readers)" value={block.title ?? ""} maxLength={150} disabled={readOnly} onChange={(e) => update({ title: e.target.value || null })} />
        </>
      );
    }
    case "button":
      return (
        <>
          <TextField label="Button text" value={block.label} maxLength={60} required disabled={readOnly} onChange={(e) => update({ label: e.target.value })} />
          <TextField label="Link" value={block.url} maxLength={2048} required disabled={readOnly} inputMode="url"
            hint="https://…, mailto:name@example.com or tel:+91…" onChange={(e) => update({ url: e.target.value.trim() })} />
        </>
      );
    case "divider":
      return <p className="text-sm text-mute">A decorative line between blocks.</p>;
    case "map":
      return (
        <>
          <TextField label="Place name" value={block.name} maxLength={150} required disabled={readOnly} onChange={(e) => update({ name: e.target.value })} />
          <TextArea label="Address (optional)" value={block.address ?? ""} maxLength={300} rows={2} disabled={readOnly} onChange={(e) => update({ address: e.target.value || null })} />
          <TextField label="Maps link (optional)" value={block.url ?? ""} maxLength={2048} inputMode="url" disabled={readOnly}
            hint="Paste a Google Maps link, or leave empty to search for the place and address." onChange={(e) => update({ url: e.target.value.trim() || null })} />
        </>
      );
  }
}
