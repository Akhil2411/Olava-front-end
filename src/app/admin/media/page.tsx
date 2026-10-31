import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { getMedia, getStorage, requireStaff } from "@/features/admin/data";
import { MediaGrid } from "@/features/admin/components/MediaGrid";
import { bytes, FilterBar, FilterSelect, PageHeader, Pager, Panel, Stat } from "@/features/admin/components/ui";

const PURPOSES: Record<string, string> = { Gallery: "Gallery", Hero: "Cover photos", EventCover: "Event photos", Story: "Story", Section: "Section photos", Music: "Music", Video: "Video", Other: "Other" };
const label = (p: string) => PURPOSES[p] ?? p;

export default async function AdminMediaPage({ searchParams }: PageProps<"/admin/media">) {
  const sp = await searchParams;
  const weddingId = typeof sp.wedding === "string" ? sp.wedding : "";
  const purpose = typeof sp.purpose === "string" ? sp.purpose : "";
  const page = Number(sp.page) || 1;
  const [storage, media, staff] = await Promise.all([getStorage(), getMedia({ weddingId, purpose, page }), requireStaff()]);
  const href = (p: number) => `/admin/media?${new URLSearchParams({ wedding: weddingId, purpose, page: String(p) })}`;
  const filtered = storage.topWeddings.find((w) => w.weddingId === weddingId);
  return (
    <>
      <PageHeader title="Media & storage" description="Photos and files couples have uploaded. Remove anything that breaks the rules; the couple's site stops showing it." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Storage used" value={bytes(storage.totalBytes)} />
        <Stat label="Files" value={storage.totalFiles.toLocaleString("en-IN")} />
        <Stat label="Largest wedding" value={storage.topWeddings[0] ? bytes(storage.topWeddings[0].bytes) : "—"} hint={storage.topWeddings[0]?.wedding} />
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="By type">
          <ul className="space-y-2 text-sm">
            {storage.byPurpose.map((p) => (
              <li key={p.purpose} className="flex justify-between gap-3">
                <Link href={`/admin/media?purpose=${encodeURIComponent(p.purpose)}`} className="hover:text-pink-dark">{label(p.purpose)}</Link>
                <span className="text-mute">{p.files} files · {bytes(p.bytes)}</span>
              </li>
            ))}
            {storage.byPurpose.length === 0 ? <li className="text-mute">Nothing uploaded yet.</li> : null}
          </ul>
        </Panel>
        <Panel title="Weddings using the most space">
          <ul className="space-y-2 text-sm">
            {storage.topWeddings.map((w) => (
              <li key={w.weddingId} className="flex justify-between gap-3">
                <Link href={`/admin/media?wedding=${w.weddingId}`} className="min-w-0 truncate hover:text-pink-dark">{w.wedding}<span className="text-mute"> · {w.ownerEmail}</span></Link>
                <span className="shrink-0 text-mute">{bytes(w.bytes)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <FilterBar action="/admin/media">
        {weddingId ? <input type="hidden" name="wedding" value={weddingId} /> : null}
        <FilterSelect name="purpose" label="Type" defaultValue={purpose} options={[["", "All"], ...storage.byPurpose.map((p) => [p.purpose, label(p.purpose)] as [string, string])]} />
      </FilterBar>
      {weddingId ? <p className="mb-3 text-sm">Showing files for <b>{filtered?.wedding ?? "one wedding"}</b>. <Link href="/admin/media" className="text-pink-dark underline">Show all</Link></p> : null}
      {media.items.length === 0 ? <EmptyState title="No files">Nothing matches this filter.</EmptyState> : <MediaGrid items={media.items} isAdmin={staff.isAdmin} />}
      <Pager page={media.page} pageSize={media.pageSize} total={media.totalCount} href={href} />
    </>
  );
}
