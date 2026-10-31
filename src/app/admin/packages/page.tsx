import Link from "next/link";
import { Badge, EmptyState, StatusBadge } from "@/components/ui";
import { getPurchases, getTiers, requireStaff } from "@/features/admin/data";
import { DataTable, FilterBar, FilterInput, FilterSelect, PageHeader, Pager, Td, when } from "@/features/admin/components/ui";
import { PackageActions } from "@/features/admin/components/PackageActions";
import { TierEditor } from "@/features/admin/components/TierEditor";
import { cn } from "@/lib/utils/cn";

export default async function AdminPackagesPage({ searchParams }: PageProps<"/admin/packages">) {
  const sp = await searchParams;
  const tab = sp.tab === "purchases" ? "purchases" : "packages";
  const [tiers, staff] = await Promise.all([getTiers(), requireStaff()]);
  const tabs = [["packages", "Packages & prices"], ["purchases", "Weddings' packages"]] as const;
  return (
    <>
      <PageHeader title="Packages" description="Couples pay once per wedding for a package. A price change applies to new purchases only; a sold package keeps its terms." />
      <nav aria-label="Packages" className="mb-5 flex gap-1 border-b border-line">
        {tabs.map(([key, label]) => (
          <Link key={key} href={`/admin/packages?tab=${key}`} aria-current={tab === key ? "page" : undefined}
            className={cn("border-b-2 px-3 py-2.5 text-sm font-medium", tab === key ? "border-pink-dark font-semibold text-pink-deep" : "border-transparent text-mute hover:text-ink")}>
            {label}
          </Link>
        ))}
      </nav>
      {tab === "packages" ? <TierEditor tiers={tiers} isAdmin={staff.isAdmin} /> : <Purchases sp={sp} tiers={tiers} isAdmin={staff.isAdmin} />}
    </>
  );
}

async function Purchases({ sp, tiers, isAdmin }: { sp: Record<string, string | string[] | undefined>; tiers: Awaited<ReturnType<typeof getTiers>>; isAdmin: boolean }) {
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Number(sp.page) || 1;
  const data = await getPurchases({ q, status, page });
  const href = (p: number) => `/admin/packages?${new URLSearchParams({ tab: "purchases", q, status, page: String(p) })}`;
  return (
    <>
      <FilterBar action="/admin/packages">
        <input type="hidden" name="tab" value="purchases" />
        <FilterInput name="q" label="Search" defaultValue={q} placeholder="Couple, web address or owner email" />
        <FilterSelect name="status" label="Package" defaultValue={status}
          options={[["", "Any package"], ["active", "Live"], ["expired", "Expired"], ["granted", "Granted free"], ["none", "No package yet"]]} />
      </FilterBar>
      <DataTable head={["Wedding", "Package", "Source", "Live until", "Site", ""]}
        empty={data.items.length === 0 ? <EmptyState title="Nothing here">Try another search or filter.</EmptyState> : null}>
        {data.items.map((p) => (
          <tr key={p.weddingId}>
            <Td label="Wedding">
              <span className="font-semibold">{p.wedding}</span>
              <span className="block text-xs text-mute">/{p.slug}{p.ownerEmail ? <> · {p.ownerId ? <Link className="underline" href={`/admin/users/${p.ownerId}`}>{p.ownerEmail}</Link> : p.ownerEmail}</> : null}</span>
            </Td>
            <Td label="Package">
              {p.package ?? <span className="text-mute">None</span>}{" "}
              {p.packageStatus === "active" ? <Badge tone="success">Live</Badge> : p.packageStatus === "expired" ? <Badge tone="warning">Expired</Badge> : null}
            </Td>
            <Td label="Source">{p.source === "paid" ? "Paid" : p.source === "granted" ? "Granted" : "—"}</Td>
            <Td label="Live until">{when(p.liveUntil)}{p.manualUntil ? <span className="block text-xs text-mute">set by staff</span> : null}</Td>
            <Td label="Site"><StatusBadge status={p.weddingStatus} />{p.blocked ? <Badge tone="danger" className="ml-1">Offline</Badge> : null}</Td>
            <Td label=""><PackageActions weddingId={p.weddingId} wedding={p.wedding} hasPackage={p.packageStatus !== "none"} tiers={tiers} isAdmin={isAdmin} blocked={p.blocked} /></Td>
          </tr>
        ))}
      </DataTable>
      <Pager page={data.page} pageSize={data.pageSize} total={data.totalCount} href={href} />
    </>
  );
}
