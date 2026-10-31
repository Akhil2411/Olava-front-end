"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Alert, Button, Checkbox, Switch } from "@/components/ui";
import type { MusicIcon, MusicPosition, MusicSettings, MusicTrack, Palette } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { contrast } from "@/lib/utils/color";
import { removeMusicUploadAction, updateMusicAction, uploadMusicAction, type MusicChange } from "@/features/design/musicActions";
import { onMusicClaimed } from "@/templates/designs/shared/events";
import { MUSIC_ICONS, Player, iconInk } from "@/templates/designs/shared/MusicButton";

const TRACKS: { key: Exclude<MusicTrack, "custom">; name: string; about: string }[] = [
  { key: "music-box", name: "Music box", about: "A soft, romantic music-box melody." },
  { key: "raga", name: "Raga Bhupali", about: "A gentle tanpura drone with a santoor-like melody." },
  { key: "diya", name: "Diya score", about: "Raga Yaman: a warm drone and santoor-like plucks in a candlelit hall." },
];
const ICONS = Object.keys(MUSIC_ICONS) as MusicIcon[];
const MB = 1024 * 1024;

/**
 * Listening to a track from the panel. One sample at a time; it stops when the browser tab is hidden, when the
 * panel closes (switching to Sections/Template or leaving the page), and when the preview's music button starts.
 */
function useSample() {
  const player = useRef<Player | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const stop = useCallback(() => {
    player.current?.dispose();
    player.current = null;
    setPlaying(null);
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    const offClaim = onMusicClaimed((by) => { if (by !== player.current) stop(); });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
      offClaim();
      player.current?.dispose();
      player.current = null;
    };
  }, [stop]);

  const toggle = async (key: string, track: MusicTrack, src: string | null) => {
    if (playing === key) { stop(); return; }
    stop();
    const p = new Player(track, src);
    player.current = p;
    setPlaying(key);
    const ok = await p.play(); // claims the page, so the preview's button pauses
    if (player.current !== p) { p.dispose(); return; } // stopped or replaced meanwhile
    if (!ok) stop();
  };

  return { playing, toggle, stop };
}

function SampleButton({ name, playing, onClick }: { name: string; playing: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={playing}
      aria-label={playing ? `Pause ${name}` : `Listen to ${name}`} title={playing ? "Pause" : "Listen"}
      className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border border-pink-dark transition",
        playing ? "bg-pink-dark text-white" : "bg-white text-pink-dark hover:bg-tint")}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        {playing
          ? <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>
          : <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />}
      </svg>
    </button>
  );
}

/**
 * Background music for Premium designs: on/off, built-in melody or the couple's own track, and the floating
 * button's icon, colour and corner. Changes save straight away and show in the preview.
 */
export function MusicPanel({ weddingId, music, palette, readOnly, onChange }: {
  weddingId: string; music: MusicSettings; palette: Palette; readOnly: boolean; onChange: (music: MusicSettings) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const [rights, setRights] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sample = useSample();

  if (!music.available) {
    return <Alert tone="info">Background music is available on Premium templates. Choose one in 🎨 Template.</Alert>;
  }

  const save = (patch: Partial<MusicChange>) => {
    const next: MusicChange = { enabled: music.enabled, track: music.track, icon: music.icon, color: music.color, position: music.position, ...patch };
    onChange({ ...music, ...next });
    setError(null);
    start(async () => {
      const result = await updateMusicAction(weddingId, next);
      if (result.ok) onChange(result.data); else { setError(result.error.message); onChange(music); }
    });
  };

  const upload = () => {
    if (!file) return;
    if (file.size > 10 * MB) { setError("Music files must be 10 MB or smaller."); return; }
    const form = new FormData();
    form.set("file", file);
    form.set("rightsConfirmed", rights ? "true" : "false");
    setError(null);
    if (sample.playing === "custom") sample.stop();
    start(async () => {
      const result = await uploadMusicAction(weddingId, form);
      if (result.ok) { onChange(result.data); setFile(null); setRights(false); if (fileInput.current) fileInput.current.value = ""; }
      else setError(result.error.message);
    });
  };

  const remove = () => start(async () => {
    if (sample.playing === "custom") sample.stop();
    const result = await removeMusicUploadAction(weddingId);
    if (result.ok) onChange(result.data); else setError(result.error.message);
  });

  const current = music.track ?? music.defaultTrack;
  const locked = readOnly || !music.enabled;
  const color = music.color ?? palette.accent;
  const swatches = Array.from(new Set([palette.accent, palette.text, palette.muted, "#1d1a18", "#ffffff"].map((c) => c.toLowerCase())));
  const faint = /^#[0-9a-f]{6}$/i.test(palette.background) && contrast(color, palette.background) < 1.6;

  return (
    <div className="space-y-6" aria-busy={saving || undefined}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Switch label="Play music on your website" checked={music.enabled} disabled={readOnly || saving} onChange={(v) => save({ enabled: v })} />
      <p className="-mt-3 text-xs text-mute">Music starts when a guest opens your invitation. Guests can pause it with the floating button.</p>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">Music</legend>
        <div className="grid grid-cols-1 gap-2">
          {TRACKS.map((t) => (
            <div key={t.key} className={cn("flex items-center gap-2 rounded-2xl border pr-3", current === t.key ? "border-pink-dark bg-tint" : "border-line")}>
              <label className={cn("flex min-w-0 flex-1 items-start gap-3 py-3 pl-4", locked ? "opacity-60" : "cursor-pointer")}>
                <input type="radio" name="music-track" className="mt-1 accent-[var(--color-pink-dark)]" checked={current === t.key} disabled={locked}
                  onChange={() => save({ track: t.key === music.defaultTrack ? null : t.key })} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t.name}{t.key === music.defaultTrack ? " · this design's melody" : ""}</span>
                  <span className="block text-xs text-mute">{t.about}</span>
                </span>
              </label>
              <SampleButton name={t.name} playing={sample.playing === t.key} onClick={() => void sample.toggle(t.key, t.key, null)} />
            </div>
          ))}
          <div className={cn("flex items-center gap-2 rounded-2xl border pr-3", current === "custom" ? "border-pink-dark bg-tint" : "border-line")}>
            <label className={cn("flex min-w-0 flex-1 items-start gap-3 py-3 pl-4", locked || !music.upload ? "opacity-70" : "cursor-pointer")}>
              <input type="radio" name="music-track" className="mt-1 accent-[var(--color-pink-dark)]" checked={current === "custom"} disabled={locked || !music.upload}
                onChange={() => save({ track: "custom" })} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Your own music</span>
                <span className="block truncate text-xs text-mute" title={music.upload?.fileName ?? undefined}>
                  {music.upload ? `${music.upload.fileName ?? "Uploaded track"} · ${(music.upload.sizeBytes / MB).toFixed(1)} MB` : "Upload a track below."}
                </span>
              </span>
            </label>
            {music.upload ? (
              <SampleButton name="your own music" playing={sample.playing === "custom"}
                onClick={() => void sample.toggle("custom", "custom", `/api/media/${weddingId}/${music.upload!.mediaId}/audio`)} />
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset disabled={readOnly || !music.enabled} className="min-w-0 space-y-6 disabled:opacity-60">

        <div className="space-y-3 rounded-2xl border border-line p-4">
          <p className="text-sm font-semibold">{music.upload ? "Replace your track" : "Upload your own track"}</p>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-white px-3 py-2.5 hover:bg-tint has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-pink-dark">
            <input ref={fileInput} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a" className="sr-only"
              aria-describedby="music-file-hint" onChange={(e) => { setError(null); setFile(e.target.files?.[0] ?? null); }} />
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tint text-pink-dark">♪</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{file ? "Change file" : "Choose a music file"}</span>
              <span className="block truncate text-xs text-mute">{file ? `${file.name} · ${(file.size / MB).toFixed(1)} MB` : "No file chosen"}</span>
            </span>
          </label>
          <p id="music-file-hint" className="text-xs text-mute">MP3 or M4A, up to 10 MB. One track per website.</p>
          <Checkbox label="I confirm that I own this music or have permission to use it on my wedding website."
            checked={rights} onChange={(e) => setRights(e.target.checked)}
            hint="Most songs are protected by copyright. Use music you've bought a licence for, or that's free to use." />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={upload} disabled={!file || !rights || saving} loading={saving && !!file}>Upload</Button>
            {music.upload ? <Button size="sm" variant="ghost" className="text-danger" onClick={remove} disabled={saving}>Remove my track</Button> : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold" id="music-icon-label">Button icon</p>
          <div role="radiogroup" aria-labelledby="music-icon-label" className="grid grid-cols-6 gap-2">
            {ICONS.map((icon) => (
              <button key={icon} type="button" role="radio" aria-checked={music.icon === icon} aria-label={MUSIC_ICONS[icon].label}
                onClick={() => save({ icon })}
                className={cn("grid aspect-square place-items-center rounded-xl border", music.icon === icon ? "border-pink-dark bg-tint" : "border-line")}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {MUSIC_ICONS[icon].path}
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold" id="music-color-label">Button colour</p>
          <div role="radiogroup" aria-labelledby="music-color-label" className="flex flex-wrap items-center gap-2">
            <button type="button" role="radio" aria-checked={music.color === null} onClick={() => save({ color: null })}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", music.color === null ? "border-pink-dark bg-tint" : "border-line")}>
              Design colour
            </button>
            {swatches.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={music.color === c} aria-label={`Colour ${c}`} onClick={() => save({ color: c })}
                className={cn("h-8 w-8 rounded-full border-2", music.color === c ? "border-pink-dark ring-2 ring-pink-dark/30" : "border-line")} style={{ background: c }} />
            ))}
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#000000"} className="h-8 w-10 cursor-pointer rounded border border-line bg-white"
                onChange={(e) => save({ color: e.target.value.toLowerCase() })} aria-label="Custom colour" />
              Custom
            </label>
          </div>
          {faint ? <p className="mt-2 text-xs text-warning" role="status">This colour is close to your page background, so the button may be hard to see.</p> : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold" id="music-pos-label">Position</p>
          <div role="radiogroup" aria-labelledby="music-pos-label" className="grid grid-cols-2 gap-2">
            {(["top-right", "bottom-right"] as MusicPosition[]).map((p) => (
              <button key={p} type="button" role="radio" aria-checked={music.position === p} onClick={() => save({ position: p })}
                className={cn("flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm", music.position === p ? "border-pink-dark bg-tint font-semibold" : "border-line")}>
                <span aria-hidden="true" className="relative h-9 w-6 shrink-0 rounded-md border border-line bg-white">
                  <span className={cn("absolute right-0.5 h-2 w-2 rounded-full", p === "top-right" ? "top-0.5" : "bottom-0.5")} style={{ background: color }} />
                </span>
                {p === "top-right" ? "Top right" : "Bottom right"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-mute">The button stays in that corner while guests scroll.</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-tint p-3 text-sm">
          <span className="grid h-11 w-11 place-items-center rounded-full shadow" style={{ background: color, color: iconInk(color) }} aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{MUSIC_ICONS[music.icon].path}</svg>
          </span>
          Tap the button in the preview to listen.
        </div>
      </fieldset>
    </div>
  );
}
