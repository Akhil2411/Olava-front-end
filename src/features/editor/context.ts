"use client";

import { createContext, useContext } from "react";
import type { Media } from "@/lib/api/types";

export interface EditorEnv {
  weddingId: string;
  media: Media[];
  readOnly: boolean;
  /** Adds a freshly uploaded image (or video) to the editor's media lists. */
  onUploaded: (media: Media) => void;
  /** The wedding's uploaded videos (Video sections and video blocks). */
  videos?: Media[];
  /** Removes a deleted file from the editor's lists. */
  onRemoved?: (mediaId: string) => void;
  /** Field to focus when a section editor opens from a tap on the preview. */
  focusField: string | null;
  /** The couple's first names (labels like "Zayn's family line"). */
  partnerNames?: [string, string];
  /** The current design (template layout key): which layouts and wording fields it offers. */
  design?: string | null;
}

export const EditorContext = createContext<EditorEnv | null>(null);

export function useEditor(): EditorEnv {
  const env = useContext(EditorContext);
  if (!env) throw new Error("useEditor must be used inside the site editor.");
  return env;
}

let counter = 0;
/** Short client-side id for new blocks (the API accepts [A-Za-z0-9_-]{4,40}). */
export function newId(prefix = "b"): string {
  counter = (counter + 1) % 1_000_000;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
