"use server";

import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { MusicIcon, MusicPosition, MusicSettings, MusicTrack } from "@/lib/api/types";

const TRACKS = ["music-box", "raga", "diya", "custom"];
const ICONS = ["note", "heart", "rings", "bell", "flower", "speaker"];
const POSITIONS = ["bottom-right", "top-right"];

export interface MusicChange {
  enabled: boolean;
  track: MusicTrack | null;
  icon: MusicIcon;
  color: string | null;
  position: MusicPosition;
}

/** Saves the music settings (the API validates every value and checks the design offers music). */
export async function updateMusicAction(weddingId: string, change: MusicChange): Promise<ActionResult<MusicSettings>> {
  if (!isId(weddingId) || typeof change !== "object" || change === null) return badRequest();
  if ((change.track !== null && !TRACKS.includes(change.track)) || !ICONS.includes(change.icon) || !POSITIONS.includes(change.position)
    || (change.color !== null && !/^#[0-9a-f]{6}$/i.test(change.color))) return badRequest();
  const result = toAction(await api<MusicSettings>(`/api/v1/weddings/${weddingId}/music`, {
    method: "PUT",
    body: { enabled: Boolean(change.enabled), track: change.track, icon: change.icon, color: change.color, position: change.position },
  }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

/** Uploads the couple's own track (MP3 or M4A, up to 10 MB) after they confirm they may use it. */
export async function uploadMusicAction(weddingId: string, formData: FormData): Promise<ActionResult<MusicSettings>> {
  if (!isId(weddingId)) return badRequest();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return badRequest("Choose an MP3 or M4A file.");
  if (file.size > 10 * 1024 * 1024) return badRequest("Music files must be 10 MB or smaller.");
  const form = new FormData();
  form.set("file", file, file.name);
  form.set("rightsConfirmed", formData.get("rightsConfirmed") === "true" ? "true" : "false");
  const result = toAction(await api<MusicSettings>(`/api/v1/weddings/${weddingId}/music/upload`, { form }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function removeMusicUploadAction(weddingId: string): Promise<ActionResult<MusicSettings>> {
  if (!isId(weddingId)) return badRequest();
  const result = toAction(await api<MusicSettings>(`/api/v1/weddings/${weddingId}/music/upload`, { method: "DELETE" }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}
