import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";
import { getUsers } from "@/features/admin/data";
import { DataTable, FilterBar, FilterInput, FilterSelect, PageHeader, Pager, Td, when } from "@/features/admin/components/ui";
import { formatMoney } from "@/lib/utils/format";

const ROLE_NAMES: Record<string, string> = { PlatformAdmin: "Admin", Support: "Support" };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const role = typeof sp.role === "string" ? sp.role : "";
  const page = Number(sp.page) || 1;
  const data = await getUsers({ q, status, role, page });
  const href = (p: number) => `/admin/users?${new URLSearchParams({ q, status, role, page: String(p) })}`;
  return (
    <>
      <PageHeader title="Users" description="Everyone with an account. Open a user to see their weddings, payments and activity, or to suspend, change role or delete." />
      <FilterBar action="/admin/users">
        <FilterInput name="q" label="Search" defaultValue={q} placeholder="Name or email" />
        <FilterSelect name="status" label="Status" defaultValue={status} options={[["", "All"], ["active", "Active"], ["suspended", "Suspended"]]} />
        <FilterSelect name="role" label="Role" defaultValue={role} options={[["", "Any"], ["staff", "Any staff role"], ["PlatformAdmin", "Admin"], ["Support", "Support"]]} />
      </FilterBar>
      <DataTable head={["User", "Status", "Package", "Weddings", "Paid", "Joined", "Last sign-in"]}
        empty={data.items.length === 0 ? <EmptyState title="No users match">Try another search or filter.</EmptyState> : null}>
        {data.items.map((u) => (
          <tr key={u.id} className="hover:bg-blush/60">
            <Td label="User">
              <Link href={`/admin/users/${u.id}`} className="font-semibold hover:text-pink-dark">{u.name || "(no name)"}</Link>
              <span className="block truncate text-xs text-mute">{u.email}</span>
              {u.roles.map((r) => <Badge key={r} className="mr-1 mt-1">{ROLE_NAMES[r] ?? r}</Badge>)}
            </Td>
            <Td label="Status">
              {u.status === "suspended" ? <Badge tone="danger">Suspended</Badge> : <Badge tone="success">Active</Badge>}
              {!u.emailConfirmed ? <span className="mt-1 block text-xs text-mute">Email not confirmed</span> : null}
            </Td>
            <Td label="Package">{u.package ?? <span className="text-mute">None</span>}</Td>
            <Td label="Weddings">{u.weddings}{u.liveSites ? <span className="block text-xs text-success">{u.liveSites} live</span> : null}</Td>
            <Td label="Paid">{u.paidMinor ? formatMoney(u.paidMinor) : "—"}</Td>
            <Td label="Joined">{when(u.createdAt)}</Td>
            <Td label="Last sign-in">{when(u.lastLoginAt)}</Td>
          </tr>
        ))}
      </DataTable>
      <Pager page={data.page} pageSize={data.pageSize} total={data.totalCount} href={href} />
    </>
  );
}
