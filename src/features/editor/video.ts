import type { Media } from "@/lib/api/types";

/** The same rules as the API (VideoFormats): checked here as soon as a file is picked, and again on the server. */
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
export const VIDEO_ACCEPT = "video/mp4,video/webm,.mp4,.webm";

/** A friendly reason the file can't be used, or null. The server also checks the file's real contents. */
export function videoProblem(file: { name: string; type: string; size: number }): string | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === "video/quicktime" || name.endsWith(".mov"))
    return "QuickTime (.mov) videos don't play in every browser. Export or save it as MP4 and upload that.";
  const known = type === "video/mp4" || type === "video/webm" || (!type && (name.endsWith(".mp4") || name.endsWith(".webm")));
  if (!known) return "This file type isn't supported. Upload an MP4 or WebM video.";
  if (file.size > MAX_VIDEO_BYTES) return "This video is larger than 30 MB. Please choose a smaller file.";
  if (file.size === 0) return "The file is empty.";
  return null;
}

export function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export type UploadOutcome = { ok: true; media: Media } | { ok: false; message: string };

/**
 * Uploads with XMLHttpRequest, which (unlike fetch) reports upload progress. Resolves with the stored video, or
 * the API's message (wrong format, too large…). `signal` cancels the upload.
 */
export function uploadVideo(weddingId: string, file: File, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<UploadOutcome> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/weddings/${weddingId}/videos`);
    xhr.responseType = "text";
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      let body: Record<string, unknown> = {};
      try { body = JSON.parse(xhr.responseText || "{}"); } catch { /* not JSON */ }
      if (xhr.status === 201) resolve({ ok: true, media: body as unknown as Media });
      else resolve({ ok: false, message: typeof body.detail === "string" ? body.detail
        : xhr.status === 413 ? "This video is larger than 30 MB. Please choose a smaller file." : "The upload didn't work. Please try again." });
    };
    xhr.onerror = () => resolve({ ok: false, message: "The upload was interrupted. Check your connection and try again." });
    xhr.onabort = () => resolve({ ok: false, message: "Upload cancelled." });
    signal?.addEventListener("abort", () => xhr.abort());
    const form = new FormData();
    form.set("file", file, file.name);
    xhr.send(form);
  });
}
