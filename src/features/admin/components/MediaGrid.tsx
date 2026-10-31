"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, ConfirmDialog } from "@/components/ui";
import { deleteMediaAction } from "../actions";
import type { AdminMedia } from "../types";
import { bytes, when } from "./ui";

export function MediaGrid({ items, isAdmin }: { items: AdminMedia[]; isAdmin: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<AdminMedia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((m) => (
          <li key={m.id} className="overflow-hidden rounded-2xl border border-line bg-white">
            {m.contentType.startsWith("image/")
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={`/api/admin/media/${m.id}`} alt={m.caption ?? `Photo from ${m.wedding ?? "a wedding"}`} loading="lazy" className="aspect-square w-full bg-tint object-cover" />
              : <span className="grid aspect-square place-items-center bg-tint text-sm text-mute">{m.contentType.split("/")[0] === "audio" ? "♪ Audio" : m.contentType}</span>}
            <div className="space-y-0.5 p-2 text-xs">
              <p className="truncate font-semibold">{m.wedding ?? "—"}</p>
              <p className="truncate text-mute">{m.purpose === "Hero" ? "Cover" : m.purpose === "EventCover" ? "Event" : m.purpose} · {bytes(m.sizeBytes)} · {when(m.createdAt)}</p>
              {isAdmin && m.purpose !== "Music" && m.purpose !== "Video" ? <Button size="sm" variant="ghost" className="-ml-2 text-danger" onClick={() => { setError(null); setDeleting(m); }}>Delete</Button> : null}
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} busy={pending} title="Delete this file?" confirmLabel="Delete file"
        onConfirm={() => deleting && start(async () => {
          const r = await deleteMediaAction(deleting.id);
          if (r.ok) { setDeleting(null); router.refresh(); } else setError(r.error.message);
        })}>
        <p>It&apos;s removed from {deleting?.wedding ?? "the wedding"} (including the live site) and can&apos;t be recovered. The couple isn&apos;t told automatically.</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}
