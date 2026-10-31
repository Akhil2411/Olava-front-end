"use client";

import { useRef, useState } from "react";
import { Alert, Button, ConfirmDialog } from "@/components/ui";
import { deleteMediaAction } from "@/features/gallery/actions";
import { cn } from "@/lib/utils/cn";
import { useEditor } from "./context";
import { FieldFrame, ImageField } from "./fields";
import { VIDEO_ACCEPT, formatSize, uploadVideo, videoProblem } from "./video";

/**
 * Upload / replace / remove a video (MP4 or WebM, up to 30 MB) with a progress bar and a preview, plus an
 * optional cover photo. The file is checked as soon as it's picked; the server checks it again (size and real
 * format). Replacing or removing deletes the old file.
 */
export function VideoField({ field, videoMediaId, posterMediaId, onChange }: {
  field: string; videoMediaId: string | null; posterMediaId: string | null;
  onChange: (next: { videoMediaId: string | null; posterMediaId: string | null }) => void;
}) {
  const { weddingId, videos = [], readOnly, onUploaded, onRemoved } = useEditor();
  const current = videos.find((v) => v.id === videoMediaId);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  const pick = async (file: File) => {
    const problem = videoProblem(file);
    if (problem) { setError(problem); return; }
    setError(null);
    setProgress(0);
    abort.current = new AbortController();
    const result = await uploadVideo(weddingId, file, setProgress, abort.current.signal);
    setProgress(null);
    if (!result.ok) { setError(result.message); return; }
    onUploaded(result.media);
    const old = videoMediaId;
    onChange({ videoMediaId: result.media.id, posterMediaId });
    if (old && old !== result.media.id) { void deleteMediaAction(weddingId, old); onRemoved?.(old); }
  };

  const remove = async () => {
    setConfirmRemove(false);
    const old = videoMediaId;
    onChange({ videoMediaId: null, posterMediaId });
    if (old) { await deleteMediaAction(weddingId, old); onRemoved?.(old); }
  };

  const uploading = progress !== null;
  return (
    <FieldFrame field={field} className="space-y-3">
      <p className="text-sm font-semibold">Video</p>
      {current ? (
        <div className="space-y-2">
          <video src={`/api/media/${weddingId}/${current.id}/video`} controls playsInline preload="metadata"
            poster={posterMediaId ? `/api/media/${weddingId}/${posterMediaId}/large` : undefined}
            className="aspect-video w-full rounded-xl bg-black" aria-label="Preview of your video" />
          <p className="text-xs text-mute">{current.caption ?? "Your video"} · {formatSize(current.sizeBytes)} · {current.contentType === "video/webm" ? "WebM" : "MP4"}</p>
        </div>
      ) : videoMediaId ? (
        <p className="text-xs text-warning">This video was removed. Upload another one.</p>
      ) : (
        <p className="text-sm text-mute">MP4 or WebM, up to 30 MB. Most phones save videos as MP4.</p>
      )}

      {uploading ? (
        <div className="space-y-1.5" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-tint" role="progressbar" aria-label="Uploading video"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((progress ?? 0) * 100)}>
            <div className="h-full rounded-full bg-pink-dark transition-[width]" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-mute">
            <span>{(progress ?? 0) >= 1 ? "Checking the video…" : `Uploading… ${Math.round((progress ?? 0) * 100)}%`}</span>
            <button type="button" className="font-semibold text-pink-dark hover:underline" onClick={() => abort.current?.abort()}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={readOnly} onClick={() => input.current?.click()}>
            {current ? "Replace video" : "Upload video"}
          </Button>
          {current ? <Button size="sm" variant="ghost" disabled={readOnly} onClick={() => setConfirmRemove(true)}>Remove</Button> : null}
          <input ref={input} type="file" accept={VIDEO_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" disabled={readOnly}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void pick(f); }} />
        </div>
      )}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className={cn(!current && "opacity-70")}>
        <ImageField field={`${field}.poster`} label="Cover photo (optional)" canHide={false}
          value={{ mediaId: posterMediaId, alt: null, hidden: false }}
          onChange={(img) => onChange({ videoMediaId, posterMediaId: img.mediaId ?? null })} />
        <p className="mt-1 text-xs text-mute">Shown before the video plays. Without one, guests see the video&apos;s first frame.</p>
      </div>

      <ConfirmDialog open={confirmRemove} onClose={() => setConfirmRemove(false)} onConfirm={() => void remove()} title="Remove this video?" confirmLabel="Remove video">
        <p>The video will be deleted from your website. You can upload another one any time.</p>
      </ConfirmDialog>
    </FieldFrame>
  );
}
