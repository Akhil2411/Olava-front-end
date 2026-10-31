import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { describe } from "@/features/admin/activity";
import { getActivity } from "@/features/admin/data";
import { DataTable, FilterBar, FilterInput, FilterSelect, PageHeader, Pager, Td, whenTime } from "@/features/admin/components/ui";

export default async function AdminActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const all = sp.all === "1" ? "1" : "";
  const page = Number(sp.page) || 1;
  const data = await getActivity({ q, all, page });
  const href = (p: number) => `/admin/activity?${new URLSearchParams({ q, all, page: String(p) })}`;
  return (
    <>
      <PageHeader title="Activity log" description="Who did what. By default only actions taken by staff in the admin panel; include everything to see sign-ins, payments and edits too." />
      <FilterBar action="/admin/activity">
        <FilterInput name="q" label="Search" defaultValue={q} placeholder="Action, type or email" />
        <FilterSelect name="all" label="Show" defaultValue={all} options={[["", "Admin actions"], ["1", "Everything"]]} />
      </FilterBar>
      <DataTable head={["When", "Who", "What", "IP address"]}
        empty={data.items.length === 0 ? <EmptyState title="Nothing logged">No activity matches.</EmptyState> : null}>
        {data.items.map((a) => (
          <tr key={a.id} className="align-top hover:bg-blush/60">
            <Td label="When" className="whitespace-nowrap">{whenTime(a.at)}</Td>
            <Td label="Who">{a.actorId ? <Link href={`/admin/users/${a.actorId}`} className="hover:text-pink-dark">{a.actorEmail ?? "User"}</Link> : <span className="text-mute">{a.actorEmail ?? "System"}</span>}</Td>
            <Td label="What">{describe(a)}<code className="block text-[11px] text-mute">{a.action}</code></Td>
            <Td label="IP address"><span className="text-xs text-mute">{a.ipAddress ?? "—"}</span></Td>
          </tr>
        ))}
      </DataTable>
      <Pager page={data.page} pageSize={data.pageSize} total={data.totalCount} href={href} />
    </>
  );
}
