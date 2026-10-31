import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";
import { getSites, getTiers, requireStaff } from "@/features/admin/data";
import { PackageActions } from "@/features/admin/components/PackageActions";
import { bytes, DataTable, FilterBar, FilterInput, FilterSelect, PageHeader, Pager, Td, when } from "@/features/admin/components/ui";

const STATUS: Record<string, string> = { Draft: "Draft", Published: "Live", Unpublished: "Unpublished", Archived: "Archived" };

export default async function AdminSitesPage({ searchParams }: PageProps<"/admin/sites">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Number(sp.page) || 1;
  const [data, tiers, staff] = await Promise.all([getSites({ q, status, page }), getTiers(), requireStaff()]);
  const href = (p: number) => `/admin/sites?${new URLSearchParams({ q, status, page: String(p) })}`;
  return (
    <>
      <PageHeader title="Wedding sites" description={`Every wedding. Take a site offline if it breaks the rules (the couple can't republish until you restore it)${staff.isAdmin ? ", or grant, extend or cancel its package" : ". Only admins can grant, extend or cancel packages"}.`} />
      <FilterBar action="/admin/sites">
        <FilterInput name="q" label="Search" defaultValue={q} placeholder="Couple, web address or owner email" />
        <FilterSelect name="status" label="Status" defaultValue={status} options={[["", "All"], ["published", "Live"], ["draft", "Not published"], ["archived", "Archived"], ["blocked", "Taken offline"]]} />
      </FilterBar>
      <DataTable head={["Wedding", "Owner", "Status", "Package", "Guests / files", "Created", ""]}
        empty={data.items.length === 0 ? <EmptyState title="No weddings match">Try another search or filter.</EmptyState> : null}>
        {data.items.map((s) => (
          <tr key={s.id} className="align-top hover:bg-blush/60">
            <Td label="Wedding">
              <span className="font-semibold">{s.title}</span>
              <span className="block text-xs text-mute">{s.templateName ?? "No template"} · /{s.slug}</span>
              {s.publicUrl && s.status === "Published" && !s.blocked ? <a href={s.publicUrl} target="_blank" rel="noreferrer" className="text-xs text-pink-dark underline">Open site ↗</a> : null}
            </Td>
            <Td label="Owner">{s.ownerId ? <Link href={`/admin/users/${s.ownerId}`} className="hover:text-pink-dark">{s.ownerEmail}</Link> : <span className="text-mute">—</span>}</Td>
            <Td label="Status">
              {s.blocked ? <Badge tone="danger">Taken offline</Badge> : <Badge tone={s.status === "Published" ? "success" : "neutral"}>{STATUS[s.status] ?? s.status}</Badge>}
              {s.blockedReason ? <span className="mt-1 block max-w-48 text-xs text-mute">{s.blockedReason}</span> : null}
            </Td>
            <Td label="Package">
              {s.package ?? <span className="text-mute">None</span>}
              {s.liveUntil ? <span className={s.packageStatus === "expired" ? "block text-xs text-danger" : "block text-xs text-mute"}>{s.packageStatus === "expired" ? "Ended" : "Until"} {when(s.liveUntil)}</span> : null}
            </Td>
            <Td label="Guests / files">{s.guests} guests<span className="block text-xs text-mute">{s.mediaFiles} files · {bytes(s.storageBytes)}</span></Td>
            <Td label="Created">{when(s.createdAt)}</Td>
            <Td label="Actions"><PackageActions weddingId={s.id} wedding={s.title} hasPackage={!!s.package} tiers={tiers} isAdmin={staff.isAdmin} blocked={s.blocked} /></Td>
          </tr>
        ))}
      </DataTable>
      <Pager page={data.page} pageSize={data.pageSize} total={data.totalCount} href={href} />
    </>
  );
}
