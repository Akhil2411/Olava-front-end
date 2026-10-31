import Link from "next/link";
import { Badge } from "@/components/ui";
import { getOverview } from "@/features/admin/data";
import { DataTable, PageHeader, Panel, Stat, Td, when } from "@/features/admin/components/ui";
import { formatMoney } from "@/lib/utils/format";

export default async function AdminOverviewPage() {
  const o = await getOverview();
  const max = Math.max(1, ...o.signupsByDay.map((d) => d.count));
  return (
    <>
      <PageHeader title="Overview" description="Your business at a glance. Numbers update every time you open this page." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Users" value={o.totalUsers.toLocaleString("en-IN")} hint={`${o.suspendedUsers} suspended`} href="/admin/users" />
        <Stat label="New sign-ups" value={o.newUsers7Days} hint={`last 7 days · ${o.newUsers30Days} in 30 days`} href="/admin/users" />
        <Stat label="Active packages" value={o.activePackages} hint={`${o.grantedPackages} granted free`} href="/admin/packages?tab=purchases" />
        <Stat label="Live wedding sites" value={o.liveSites} hint={`${o.totalWeddings} weddings in total`} href="/admin/sites?status=published" />
        <Stat label="Revenue, 30 days" value={formatMoney(o.revenueMinor30Days, o.currency)} hint={`${formatMoney(o.revenueMinorTotal, o.currency)} all time`} href="/admin/orders?status=paid" />
      </div>

      <Panel title="Sign-ups, last 30 days" className="mt-6">
        <div className="flex h-36 items-end gap-[3px]" role="img"
          aria-label={`Sign-ups per day over the last 30 days: ${o.signupsByDay.reduce((a, d) => a + d.count, 0)} in total`}>
          {o.signupsByDay.map((d) => (
            <div key={d.day} title={`${when(d.day)}: ${d.count}`} className="group relative flex-1">
              <div className="w-full rounded-t-[4px] bg-pink/60 transition-colors group-hover:bg-pink-dark" style={{ height: `${Math.max(2, (d.count / max) * 128)}px` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-mute"><span>{when(o.signupsByDay[0]?.day)}</span><span>Today</span></div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Newest users" action={<Link href="/admin/users" className="text-sm font-semibold text-pink-dark hover:underline">All users →</Link>}>
          <DataTable head={["User", "Joined", "Weddings"]}>
            {o.recentSignups.map((u) => (
              <tr key={u.id}>
                <Td label="User"><Link href={`/admin/users/${u.id}`} className="font-semibold hover:text-pink-dark">{u.name}</Link><span className="block truncate text-xs text-mute">{u.email}</span></Td>
                <Td label="Joined">{when(u.createdAt)}</Td>
                <Td label="Weddings">{u.weddings}</Td>
              </tr>
            ))}
          </DataTable>
        </Panel>
        <Panel title="Latest packages" action={<Link href="/admin/packages?tab=purchases" className="text-sm font-semibold text-pink-dark hover:underline">All →</Link>}>
          <DataTable head={["Wedding", "Package", "Live until"]}>
            {o.recentPurchases.map((p) => (
              <tr key={p.weddingId}>
                <Td label="Wedding"><span className="font-semibold">{p.wedding}</span><span className="block truncate text-xs text-mute">{p.ownerEmail}</span></Td>
                <Td label="Package">{p.package ?? "—"} {p.source === "granted" ? <Badge tone="neutral">Granted</Badge> : null}</Td>
                <Td label="Live until">{when(p.liveUntil)}</Td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>
    </>
  );
}
