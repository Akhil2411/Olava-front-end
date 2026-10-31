"use client";

import { GalleryManager } from "@/features/gallery/components/GalleryManager";
import { useEditor } from "./context";

/** The gallery's photos, managed right inside the Gallery section editor (upload, caption, reorder, remove). */
export function GalleryPhotos() {
  const { weddingId, media, readOnly } = useEditor();
  const photos = media.filter((m) => m.purpose === "Gallery").sort((a, b) => a.sortOrder - b.sortOrder);
  return <GalleryManager compact weddingId={weddingId} media={photos} limit={100} readOnly={readOnly} />;
}
