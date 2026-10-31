import type { SiteSection } from "@/lib/api/types";
import type { RenderContext } from "../../types";
import { VideoPlayer, VideoPlaceholder } from "./VideoPlayer";

/** An uploaded video as rendered content: { video: { ref, contentType }, poster: { ref } } (either may be null). */
export interface VideoRef { src: { ref: string; contentType: string } | null; poster: { ref: string } | null }

function read(v: unknown): VideoRef {
  const o = (v && typeof v === "object" ? v : {}) as { video?: { ref?: string | null; contentType?: string } | null; poster?: { ref?: string | null } | null };
  return {
    src: o.video?.ref ? { ref: o.video.ref, contentType: o.video.contentType ?? "video/mp4" } : null,
    poster: o.poster?.ref ? { ref: o.poster.ref } : null,
  };
}

/** The video of a Video section. */
export const videoOf = (section: SiteSection): VideoRef => read(section.content.video);

/** An uploaded video inside a custom section's video block. */
export const blockVideoOf = (block: Record<string, unknown>): VideoRef => read(block);

/**
 * The player for every design: the real video when uploaded, otherwise (editor / preview) the play-mark stand-in.
 * In the editor the player is shown but not interactive (taps open the section's form instead).
 */
export function VideoBlockView({ ctx, video, title, className }: { ctx: RenderContext; video: VideoRef; title: string; className?: string }) {
  if (!video.src) return ctx.mode === "public" ? null : <VideoPlaceholder label={ctx.mode === "edit" ? "Upload your video in this section's settings" : "Your video will appear here"} />;
  const src = ctx.imageUrl(video.src, "video");
  if (!src) return null;
  const poster = video.poster ? ctx.imageUrl(video.poster, "large") : null;
  return (
    <div className={className} inert={ctx.mode === "edit" ? true : undefined}>
      <VideoPlayer src={src} type={video.src.contentType} poster={poster} title={title} />
    </div>
  );
}
