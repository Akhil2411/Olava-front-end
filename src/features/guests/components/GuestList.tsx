"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Badge, Button, ConfirmDialog, EmptyState } from "@/components/ui";
import type { Guest, Paged } from "@/lib/api/types";
import { deleteGuestAction } from "../actions";
import { CsvImport } from "./CsvImport";
import { GuestForm } from "./GuestForm";

const STATUS: Record<string, { label: string; tone: "success" | "danger" | "warning" | "neutral" }> = {
  attending: { label: "Attending", tone: "success" },
  not_attending: { label: "Not attending", tone: "danger" },
  undecided: { label: "Maybe", tone: "warning" },
  pending: { label: "No response", tone: "neutral" },
};

export function GuestList({ weddingId, page, readOnly }: { weddingId: string; page: Paged<Guest>; readOnly: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [editing, setEditing] = useState<Guest | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<Guest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const setQuery = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    start(() => router.replace(`${pathname}?${next}`));
  };

  const pages = Math.max(1, Math.ceil(page.totalCount / page.pageSize));
  const filtered = Boolean(params.get("q") || params.get("status"));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <form className="flex min-w-0 flex-1 gap-2" role="search" onSubmit={(e) => { e.preventDefault(); setQuery("q", String(new FormData(e.currentTarget).get("q") ?? "").trim() || null); }}>
          <label htmlFor="guest-search" className="sr-only">Search guests</label>
          <input id="guest-search" name="q" defaultValue={params.get("q") ?? ""} placeholder="Search name, email, phone or group"
            className="min-w-0 flex-1 rounded-full bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-pink-dark" />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
        <label htmlFor="guest-status" className="sr-only">Filter by RSVP</label>
        <select id="guest-status" value={params.get("status") ?? ""} onChange={(e) => setQuery("status", e.target.value || null)}
          className="rounded-full bg-white px-4 py-2.5 text-sm ring-1 ring-line">
          <option value="">All responses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!readOnly ? <Button size="sm" onClick={() => setEditing("new")}>+ Add guest</Button> : null}
        {!readOnly ? <Button size="sm" variant="secondary" onClick={() => setImporting(true)}>Import CSV</Button> : null}
        <a href={`/api/weddings/${weddingId}/guests/export`} className="inline-flex items-center rounded-full border-[1.5px] border-pink-dark px-4 py-2 text-sm font-semibold text-pink-dark hover:bg-tint" download>
          Export CSV
        </a>
      </div>

      {error ? <Alert tone="error" className="mt-4">{error}</Alert> : null}

      <div className={pending ? "opacity-60 transition-opacity" : ""} aria-busy={pending}>
        {page.items.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon="💌" title={filtered ? "No guests match" : "No guests yet"}>
              {filtered ? "Try a different search or filter." : "Add guests one by one or import a CSV. Guests who RSVP on your website appear here automatically."}
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {page.items.map((g) => {
              const status = STATUS[g.rsvp?.status ?? "pending"];
              return (
                <li key={g.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{g.fullName}{g.groupName ? <span className="font-normal text-mute"> · {g.groupName}</span> : null}</p>
                    <p className="truncate text-sm text-mute">{[g.email, g.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
                    {g.rsvp?.message ? <p className="mt-1 text-sm italic">“{g.rsvp.message}”</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={status.tone}>{status.label}{g.rsvp?.status === "attending" && g.rsvp.plusOneCount ? ` +${g.rsvp.plusOneCount}` : ""}</Badge>
                    {g.source === "Website" ? <Badge tone="pink">Via website</Badge> : null}
                    {!readOnly ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => setEditing(g)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(g)}>Delete</Button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pages > 1 ? (
        <nav aria-label="Guest pages" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-mute">{page.totalCount} guests · page {page.page} of {pages}</span>
          <div className="flex gap-2">
            {page.page > 1 ? <Link className="rounded-full border border-line px-3 py-1.5" href={`?${new URLSearchParams({ ...Object.fromEntries(params), page: String(page.page - 1) })}`}>Previous</Link> : null}
            {page.page < pages ? <Link className="rounded-full border border-line px-3 py-1.5" href={`?${new URLSearchParams({ ...Object.fromEntries(params), page: String(page.page + 1) })}`}>Next</Link> : null}
          </div>
        </nav>
      ) : null}

      <GuestForm key={editing === "new" ? "new" : editing?.id ?? "none"} weddingId={weddingId} guest={editing === "new" ? null : editing}
        open={editing !== null} onClose={() => setEditing(null)} />
      <CsvImport weddingId={weddingId} open={importing} onClose={() => setImporting(false)} />
      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} title="Delete guest?" confirmLabel="Delete" busy={pending}
        onConfirm={() => start(async () => {
          if (!deleting) return;
          const result = await deleteGuestAction(weddingId, deleting.id);
          setError(result.ok ? null : result.error.message);
          setDeleting(null);
        })}>
        <p>{deleting?.fullName} and their RSVP will be permanently removed.</p>
      </ConfirmDialog>
    </div>
  );
}
