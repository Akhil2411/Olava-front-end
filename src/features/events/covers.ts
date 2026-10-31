import type { Media } from "@/lib/api/types";

/** Photos that can be an event's cover: images only, never the couple's music or videos. */
export const coverChoices = (media: Media[]) => media.filter((m) => m.contentType.startsWith("image/") && m.purpose !== "Music" && m.purpose !== "Video");
