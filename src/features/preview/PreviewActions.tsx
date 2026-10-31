"use client";

import { useSyncExternalStore } from "react";
import { LinkButton } from "@/components/ui";

const noSubscribe = () => () => {};
const isTopWindow = () => { try { return window.self === window.top; } catch { return false; } };

/** Where to go from a preview: edit it, or try another design. Both open the editor ("Edit & design" tab). */
export function PreviewActions({ weddingId, className }: { weddingId: string; className?: string }) {
  const base = `/dashboard/weddings/${weddingId}/design`;
  return (
    <div className={className}>
      <div className="flex flex-col gap-3 rounded-[22px] border border-line bg-white p-4 sm:flex-row sm:items-center">
        <p className="min-w-0 text-sm text-mute sm:flex-1">Want to change something? Edit any text, photo or section, or switch to another design. Your content stays.</p>
        <div className="grid gap-2 min-[420px]:grid-cols-2 sm:flex sm:shrink-0">
          <LinkButton href={base} size="sm">✎ Edit this website</LinkButton>
          <LinkButton href={`${base}?panel=template`} size="sm" variant="secondary">🎨 Change template</LinkButton>
        </div>
      </div>
    </div>
  );
}

/**
 * The same two links in the full-screen preview's top bar. Hidden when the preview is shown inside a frame
 * (the editor's preview, the template preview window), where they'd open the dashboard inside the frame.
 */
export function PreviewBarLinks({ weddingId }: { weddingId: string }) {
  const top = useSyncExternalStore(noSubscribe, isTopWindow, () => false);
  if (!top) return null;
  const base = `/dashboard/weddings/${weddingId}/design`;
  return (
    <span className="ml-3 inline-flex gap-3">
      <a href={base} className="underline underline-offset-2 hover:no-underline">Edit this website</a>
      <a href={`${base}?panel=template`} className="underline underline-offset-2 hover:no-underline">Change template</a>
    </span>
  );
}
