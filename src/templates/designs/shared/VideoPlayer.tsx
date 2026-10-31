"use client";

import { useEffect, useRef } from "react";
import { claimMusic, onMusicClaimed, releaseMusic } from "./events";

/**
 * An uploaded video: plays inline with the browser's own controls, never autoplays, and loads only its first
 * bytes until played (preload="metadata"). While it plays with sound the design's background music pauses, and
 * it carries on when the video pauses or ends; if the guest starts the music instead, the video pauses.
 * Colours and corners come from the design (--olv-video-radius, --olv-video-frame).
 */
export function VideoPlayer({ src, type, poster, title, className }: {
  src: string; type: string; poster?: string | null; title: string; className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const owner = useRef({ kind: "video" });

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const me = owner.current;
    let claimed = false;
    const audible = () => !video.paused && !video.muted && video.volume > 0;
    const sync = () => {
      if (audible() && !claimed) { claimed = true; claimMusic(me); }
      else if (!audible() && claimed) { claimed = false; releaseMusic(me); }
    };
    const events = ["play", "playing", "pause", "ended", "volumechange", "emptied"] as const;
    events.forEach((e) => video.addEventListener(e, sync));
    const off = onMusicClaimed((by) => { if (by !== me && !video.paused) { claimed = false; video.pause(); } });
    return () => {
      events.forEach((e) => video.removeEventListener(e, sync));
      off();
      if (claimed) releaseMusic(me);
    };
  }, []);

  return (
    <div className={`olv-video ${className ?? ""}`.trim()}>
      <video ref={ref} controls playsInline preload="metadata" poster={poster ?? undefined} aria-label={title}
        controlsList="nodownload" disablePictureInPicture={false}>
        <source src={src} type={type} />
        Your browser can&apos;t play this video.
      </video>
    </div>
  );
}

/** Stand-in for a video that isn't uploaded yet (editor and preview only): the design's frame with a play mark. */
export function VideoPlaceholder({ label = "Your video will appear here" }: { label?: string }) {
  return (
    <div className="olv-video olv-video-empty" role="img" aria-label={label}>
      <span className="olv-video-play" aria-hidden="true" />
      <span className="olv-video-note">{label}</span>
    </div>
  );
}
