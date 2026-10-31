"use client";

import { useEffect, useRef, useState } from "react";
import type { MusicIcon, SiteMusic } from "@/lib/api/types";
import { diya, musicBox, raga, type Melody } from "./melodies";
import { claimMusic, onInviteOpened, onMusicClaimed, onMusicReleased } from "./events";

/** The six icons hosts can choose from. Drawn as 24×24 line icons. */
export const MUSIC_ICONS: Record<MusicIcon, { label: string; path: React.ReactNode }> = {
  note: { label: "Music note", path: <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></> },
  heart: { label: "Heart", path: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /> },
  rings: { label: "Rings", path: <><circle cx="9" cy="14" r="5" /><circle cx="15" cy="14" r="5" /><path d="M10 5l2-2 2 2-2 2z" /></> },
  bell: { label: "Bell", path: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></> },
  flower: { label: "Flower", path: <><circle cx="12" cy="12" r="2.4" /><path d="M12 9.6c-1.6-3.4 1.6-5.6 0-7 -1.6 1.4 1.6 3.6 0 7zM14.4 12c3.4-1.6 5.6 1.6 7 0-1.4-1.6-3.6 1.6-7 0zM12 14.4c1.6 3.4-1.6 5.6 0 7 1.6-1.4-1.6-3.6 0-7zM9.6 12c-3.4 1.6-5.6-1.6-7 0 1.4 1.6 3.6-1.6 7 0z" /></> },
  speaker: { label: "Speaker", path: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" /></> },
};

/** Black or white, whichever reads better on the button colour. */
export function iconInk(hex: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return "#ffffff";
  const [r, g, b] = m.slice(1).map((x) => { const c = parseInt(x, 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.4 ? "#1d1a18" : "#ffffff";
}

/** A built-in melody (Web Audio) or the couple's uploaded track. Also used by the editor's Music panel to listen. */
export class Player {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private melody: Melody | null = null;
  private audio: HTMLAudioElement | null = null;
  playing = false;

  constructor(private readonly track: SiteMusic["track"], private readonly src: string | null) {}

  async play(): Promise<boolean> {
    try {
      if (this.track === "custom" && this.src) {
        this.audio ??= Object.assign(new Audio(this.src), { loop: true, volume: 0.6, preload: "none" });
        await this.audio.play();
      } else {
        if (!this.ctx) {
          const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          this.ctx = new Ctor();
          this.out = this.ctx.createGain();
          this.melody = this.track === "raga" ? raga() : this.track === "diya" ? diya() : musicBox();
          this.melody.connect(this.ctx, this.out);
        }
        await this.ctx.resume();
        if (this.ctx.state !== "running") return false;
        this.melody!.reset(this.ctx);
        clearInterval(this.timer);
        this.timer = setInterval(() => this.melody!.tick(this.ctx!, this.out!), 100);
      }
      this.playing = true;
      claimMusic(this);
      return true;
    } catch {
      return false; // autoplay refused or audio unavailable: stays muted until the guest taps
    }
  }

  pause() {
    this.audio?.pause();
    if (this.ctx) { clearInterval(this.timer); void this.ctx.suspend(); }
    this.playing = false;
  }

  dispose() {
    this.pause();
    void this.ctx?.close();
    this.audio = null;
  }
}

/**
 * Floating music button. Starts when the guest opens the invitation (the tap on the doors or envelope counts as
 * the gesture browsers require); otherwise it waits for a tap. Pauses while the page is in the background.
 * In the editor it sits inside the preview (sticky) instead of over the dashboard.
 */
export function MusicButton({ music, src, accent, edit = false }: {
  music: SiteMusic; src: string | null; accent: string; edit?: boolean;
}) {
  const player = useRef<Player | null>(null);
  const [playing, setPlaying] = useState(false);
  const resumeOnShow = useRef(false);
  /** Who paused the music (a video playing with sound); when it stops, the music carries on. */
  const pausedBy = useRef<object | null>(null);

  useEffect(() => {
    const p = new Player(music.track, src);
    player.current = p;
    const off = edit ? () => {} : onInviteOpened(() => { void p.play().then(setPlaying); });
    const onVisibility = () => {
      if (document.hidden && p.playing) { resumeOnShow.current = true; p.pause(); setPlaying(false); }
      else if (!document.hidden && resumeOnShow.current && !edit) { resumeOnShow.current = false; void p.play().then(setPlaying); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    // Something else started (a video with sound, a sample in the editor's Music panel): pause here.
    const offClaim = onMusicClaimed((by) => {
      if (by !== p && p.playing) { resumeOnShow.current = false; pausedBy.current = by; p.pause(); setPlaying(false); }
    });
    // ...and carry on when that video pauses or ends (not in the editor, and not if the guest paused the music).
    const offRelease = onMusicReleased((by) => {
      if (pausedBy.current !== by) return;
      pausedBy.current = null;
      if (!edit && !document.hidden) void p.play().then(setPlaying);
    });
    return () => { off(); offClaim(); offRelease(); document.removeEventListener("visibilitychange", onVisibility); p.dispose(); setPlaying(false); };
  }, [music.track, src, edit]);

  const toggle = async () => {
    const p = player.current;
    if (!p) return;
    pausedBy.current = null; // the guest decides now
    if (p.playing) { p.pause(); setPlaying(false); } else setPlaying(await p.play());
  };

  const color = music.color ?? accent;
  const icon = MUSIC_ICONS[music.icon] ?? MUSIC_ICONS.note;
  return (
    <div className="olv-music" data-position={music.position} data-edit={edit || undefined}>
      <button type="button" onClick={toggle} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"}
        className="olv-music-btn" data-playing={playing || undefined} style={{ background: color, color: iconInk(color), ["--olv-music-ring" as string]: color }}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          {icon.path}
        </svg>
      </button>
    </div>
  );
}
